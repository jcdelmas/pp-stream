import Stage from './stage';
import Sink from './sink';

export class FlowOps {

  /**
   * @param fn
   * @returns {FlowOps}
   */
  map(fn) {
    return this.via(Flow.map(fn));
  }

  /**
   * @param fn
   * @returns {FlowOps}
   */
  filter(fn) {
    return this.via(Flow.filter(fn));;
  }

  /**
   * @param fn
   * @param zero
   * @returns {FlowOps}
   */
  scan(fn, zero) {
    return this.via(new Scan(fn, zero));
  }

  /**
   * @param fn
   * @returns {FlowOps}
   */
  mapConcat(fn) {
    return this.via(new MapConcat(fn));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  grouped(n) {
    return this.via(new Grouped(n));
  }

  /**
   * @param {number} n
   * @param {number} step
   * @returns {FlowOps}
   */
  sliding(n, step = 1) {
    return this.via(new Sliding(n, step));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  take(n) {
    return this.via(new Take(n));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  drop(n) {
    return this.via(new Drop(n));
  }

  /**
   * @param {Flow|Stage} flow
   * @returns {FlowOps}
   */
  via(flow) {
    throw new Error('Not implemented');
  }
}

export default class Flow extends FlowOps {

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
    return new Flow(new Scan(fn, zero));
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static mapConcat(fn) {
    return new Flow(new MapConcat(fn));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static grouped(n) {
    return new Flow(new Grouped(n));
  }

  /**
   * @param {number} n
   * @param {number} step
   * @returns {Flow}
   */
  static sliding(n, step = 1) {
    return new Flow(new Sliding(n, step));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static take(n) {
    return new Flow(new Take(n));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static drop(n) {
    return new Flow(new Drop(n));
  }

  /**
   * @param {Stage} first
   * @param {Stage?} last
   */
  constructor(first, last) {
    super();
    if (!first) throw new Error('No first');
    this._first = first;
    this._last = last || first;
  }

  /**
   * @param {Flow|Stage} flow
   * @returns {Flow}
   */
  via(flow) {
    this.last().wireOutput(flow.first());
    flow.first().wireInput(this.last());
    return new Flow(this.first(), flow.last());
  }

  /**
   * @param {Sink|Stage} sink
   * @returns {Sink}
   */
  to(sink) {
    this.last().wireOutput(sink.first());
    sink.first().wireInput(this.last());
    return new Sink(this.first(), sink.last());
  }

  first() {
    return this._first;
  }

  last() {
    return this._last;
  }
}

class Scan extends Stage {
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

class Grouped extends Stage {
  constructor(size) {
    super();
    this.size = size;
  }

  /**
   * @type {Array}
   */
  buffer = [];

  onPush(x) {
    this.buffer.push(x);
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onUpstreamFinish() {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.finish();
  }
}

class Sliding extends Stage {
  constructor(size, step = 1) {
    super();
    this.size = size;
    this.step = step;
  }

  pendingData = false;

  buffer = [];

  onPush(x) {
    this.buffer.push(x);
    if (this.buffer.length === this.size) {
      const newBuffer = this.buffer.slice(this.step);
      this.push(this.buffer);
      this.buffer = newBuffer;
      this.pendingData = false;
    } else {
      this.pull();
      this.pendingData = true;
    }
  }

  onUpstreamFinish() {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.finish();
  }
}

class Take extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPull() {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.finish();
    }
  }
}

class Drop extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush(x) {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(x);
    }
  }
}