import _ from 'lodash';
import Promise from 'bluebird';
import { EventEmitter } from 'events';

class Route {
  /**
   * @param fn
   * @returns {Route}
   */
  map(fn) {
    return this.via(Flow.map(fn));
  }

  /**
   * @param fn
   * @returns {Route}
   */
  filter(fn) {
    return this.via(Flow.filter(fn));
  }

  /**
   * @param fn
   * @param zero
   * @returns {Route}
   */
  scan(fn, zero) {
    return this.via(Flow.scan(fn, zero));
  }

  /**
   * @param {Flow} flow
   * @returns {Route}
   */
  via(flow) {
    throw new Error('Not implemented');
  }
}

export class Source extends Route {

  /**
   * @param items
   * @returns {Source}
   */
  static from(items) {
    return new Source(new ListSourceStage(items));
  }

  /**
   * @param {Stage} out
   */
  constructor(out) {
    super();
    if (!out) throw new Error('No output');
    this.out = out;
  }

  /**
   * @param {Flow} flow
   * @returns {Source}
   */
  via(flow) {
    this.out.wireOutput(flow.in);
    flow.in.wireInput(this.out);
    return new Source(flow.out);
  }

  /**
   * @param {Sink} sink
   * @returns {Graph}
   */
  to(sink) {
    this.out.wireOutput(sink.in);
    sink.in.wireInput(this.out);
    return new Graph(sink.out);
  }

  forEach(cb) {
    return this.runWith(Sink.forEach(cb));
  }

  toList() {
    return this.runWith(Sink.toList());
  }

  reduce(fn, zero) {
    return this.runWith(Sink.reduce(fn, zero));
  }

  /**
   * @param {Sink} sink
   */
  runWith(sink) {
    return this.to(sink).run();
  }
}

export class Sink {
  /**
   * @param {Stage} input
   * @param {Stage?} output
   */
  constructor(input, output) {
    this.in = input;
    this.out = output || input;
  }

  static create(stageMethods) {
    const stage = new Stage(stageMethods);
    return new Sink(stage);
  }

  static forEach(cb) {
    return Sink.create({
      onPush(item) {
        cb(item);
        this.pull();
      }
    });
  }

  static reduce(fn, zero) {
    return new Sink(new ReduceSink(fn, zero));
  }

  static toList() {
    return Sink.reduce((xs, x) => xs.concat([x]), []);
  }
}

export class Flow extends Route {

  /**
   * @param stageMethods
   * @returns {Flow}
   */
  static create(stageMethods) {
    const stage = new Stage(stageMethods);
    return new Flow(stage);
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static map(fn) {
    return Flow.create({
      onPush(item) {
        this.push(fn(item))
      },
    });
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static filter(fn) {
    return Flow.create({
      onPush(item) {
        if (fn(item)) {
          this.push(item)
        } else {
          this.pull();
        }
      },
    });
  }

  static scan(fn, zero) {
    return new Flow(new ScanFlow(fn, zero));
  }

  /**
   * @param {Stage} input
   * @param {Stage?} output
   */
  constructor(input, output) {
    super();
    if (!input) throw new Error('No input');
    this.in = input;
    this.out = output || input;
  }

  /**
   * @param {Flow} flow
   * @returns {Flow}
   */
  via(flow) {
    this.out.wireOutput(flow.in);
    flow.in.wireInput(this.out);
    return new Flow(this.in, flow.out);
  }

  /**
   * @param {Sink} sink
   * @returns {Sink}
   */
  to(sink) {
    this.out.wireOutput(sink.in);
    sink.in.wireInput(this.out);
    return new Sink(this.in, sink.out);
  }
}

class Graph {

  constructor(lastStage) {
    this.lastStage = lastStage;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this.lastStage.pull();
    return this.lastStage.getResult();
  }

}

class Stage {

  events = new EventEmitter();

  constructor({ onPush, onPull, onUpstreamFinish, onDownstreamFinish, onError } = {}) {
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onUpstreamFinish) this.onUpstreamFinish = onUpstreamFinish.bind(this);
    if (onDownstreamFinish) this.onUpstreamFinish = onDownstreamFinish.bind(this);
    if (onError) this.onError = onError.bind(this);
  }

  finished = false;

  /**
   * @type {Stage|null}
   */
  input = null;

  /**
   * @type {Stage|null}
   */
  output = null;

  wireInput(input) {
    if (this.input) {
      throw new Error('Input already exist !');
    }
    this.input = input;
  }

  wireOutput(output) {
    if (this.output) {
      throw new Error('Output already exist !');
    }
    this.output = output;
  }

  push(item) {
    setImmediate(() => {
      try {
        this.output.onPush(item);
      } catch (e) {
        this.error(e);
      }
    });
  }

  pull() {
    this.input.onPull();
  }

  error(e) {
    if (this.output) {
      this.output.onError(e);
    } else {
      this.events.emit('error', e);
    }
  }

  finish(result) {
    this.finished = true;
    this.events.emit('finish', result);
    if (this.input && !this.input.finished) {
      this.input.onDownstreamFinish();
    }
    if (this.output && !this.output.finished) {
      this.output.onUpstreamFinish();
    }
  }

  getResult() {
    return new Promise((resolve, reject) => {
      this.events.on('finish', resolve);
      this.events.on('error', reject);
    });
  }

  /**
   * @param item
   */
  onPush(item) {
    this.push(item);
  }

  onPull() {
    this.pull()
  }

  /**
   * @param {Error} e
   */
  onError(e) {
    this.error(e);
  }

  onUpstreamFinish() {
    this.finish();
  }

  onDownstreamFinish() {
    this.finish();
  }
}

class ListSourceStage extends Stage {
  constructor(items) {
    super();
    this.index = 0;
    this.items = items;
  }

  onPull() {
    if (this.index < this.items.length) {
      this.push(this.items[this.index++]);
    } else {
      this.finish();
    }
  }
}

class ScanFlow extends Stage {
  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush(x) {
    this.acc = this.fn(this.acc, x);
    this.push(this.acc);
  }
}

class ToListSinkStage extends Stage {

  xs = [];

  onPush(x) {
    this.xs.push(x);
    this.pull();
  }

  onUpstreamFinish() {
    this.finish(this.xs);
  }
}

class ReduceSink extends Stage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush(x) {
    this.acc = this.fn(this.acc, x);
    this.pull();
  }

  onUpstreamFinish() {
    this.finish(this.acc);
  }
}
