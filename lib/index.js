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
   * @param fn
   * @returns {Route}
   */
  mapConcat(fn) {
    return this.via(Flow.mapConcat(fn));
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
   * @param {Stage} last
   */
  constructor(last) {
    super();
    if (!last) throw new Error('No output');
    this.last = last;
  }

  /**
   * @param {Flow} flow
   * @returns {Source}
   */
  via(flow) {
    this.last.wireOutput(flow.first);
    flow.first.wireInput(this.last);
    return new Source(flow.last);
  }

  /**
   * @param {Sink} sink
   * @returns {Graph}
   */
  to(sink) {
    this.last.wireOutput(sink.first);
    sink.first.wireInput(this.last);
    return new Graph(sink.last);
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
   * @param {Stage} first
   * @param {Stage?} last
   */
  constructor(first, last) {
    this.first = first;
    this.last = last || first;
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

  /**
   * @param fn
   * @param zero
   * @returns {Flow}
   */
  static scan(fn, zero) {
    return new Flow(new ScanFlow(fn, zero));
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static mapConcat(fn) {
    return new Flow(new MapConcat(fn));
  }

  /**
   * @param {Stage} first
   * @param {Stage?} last
   */
  constructor(first, last) {
    super();
    if (!first) throw new Error('No first');
    this.first = first;
    this.last = last || first;
  }

  /**
   * @param {Flow} flow
   * @returns {Flow}
   */
  via(flow) {
    this.last.wireOutput(flow.first);
    flow.first.wireInput(this.last);
    return new Flow(this.first, flow.last);
  }

  /**
   * @param {Sink} sink
   * @returns {Sink}
   */
  to(sink) {
    this.last.wireOutput(sink.first);
    sink.first.wireInput(this.last);
    return new Sink(this.first, sink.last);
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

class MapConcat extends Stage {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  /**
   * @type {number}
   */
  index = 0;

  /**
   * @type {Array|null}
   */
  current = null;

  onPush(x) {
    this.current = this.fn(x);
    this._pushNextOrPull();
  }

  onPull() {
    this._pushNextOrPull();
  }

  _pushNextOrPull() {
    if (this.current) {
      this.push(this.current[this.index++]);
      if (this.index >= this.current.length) {
        this.current = null;
        this.index = 0;
      }
    } else {
      this.pull();
    }
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

class BasicSinkStage extends Stage {

  onPush(x) {
    this.onNext(x);
    this.pull();
  }

  onNext(x) {
    throw new Error('Not implemented');
  }
}

class ReduceSink extends BasicSinkStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onNext(x) {
    this.acc = this.fn(this.acc, x);
  }

  onUpstreamFinish() {
    this.finish(this.acc);
  }
}
