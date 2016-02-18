import _ from 'lodash';
import Promise from 'bluebird';
import { EventEmitter } from 'events';

export class Source {

  static from(items) {
    return new Source(new ListSourceStage(items));
  }

  /**
   * @param {Stage} out
   */
  constructor(out) {
    if (!out) throw new Error('No output');
    this.out = out;
  }

  map(fn) {
    return this.via(Flow.map(fn));
  }

  filter(fn) {
    return this.via(Flow.filter(fn));
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
   * @param {Stage} output
   */
  constructor(input, output) {
    this.in = input;
    this.out = output;
  }

  static create(stageMethods) {
    const stage = new Stage(stageMethods);
    return new Sink(stage, stage);
  }

  static forEach(cb) {
    return Sink.create({
      onPush(item) {
        cb(item);
        this.pull();
      }
    });
  }
}

export class Flow {
  static create(stageMethods) {
    const stage = new Stage(stageMethods);
    return new Flow(stage, stage);
  }

  static map(fn) {
    return Flow.create({
      onPush(item) {
        this.push(fn(item))
      },
    });
  }

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

  /**
   * @param {Stage} input
   * @param {Stage} output
   */
  constructor(input, output) {
    if (!input) throw new Error('No input');
    if (!output) throw new Error('No output');
    this.in = input;
    this.out = output;
  }

  map(fn) {
    return this.via(Flow.map(fn));
  }

  filter(fn) {
    return this.via(Flow.filter(fn));
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
