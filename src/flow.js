import { Stage, FanInStage, FanOutStage, SimpleStage, CompoundSinkStage } from './stage';
import Sink from './sink';
import Graph from './graph';
import Module from './module';

export class FlowOps extends Graph {

  constructor(materializer) {
    super(materializer);
  }

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
    return this._viaStage(() => new Scan(fn, zero));
  }

  /**
   * @param fn
   * @returns {FlowOps}
   */
  mapConcat(fn) {
    return this._viaStage(() => new MapConcat(fn));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  grouped(n) {
    return this._viaStage(() => new Grouped(n));
  }

  /**
   * @param {number} n
   * @param {number} step
   * @returns {FlowOps}
   */
  sliding(n, step = 1) {
    return this._viaStage(() => new Sliding(n, step));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  take(n) {
    return this._viaStage(() => new Take(n));
  }

  /**
   * @param {number} n
   * @returns {FlowOps}
   */
  drop(n) {
    return this._viaStage(() => new Drop(n));
  }

  /**
   * @param {number} duration
   * @returns {FlowOps}
   */
  delay(duration) {
    return this._viaStage(() => new Delay(duration));
  }

  /**
   * @param {Flow|Stage} flow
   * @returns {FlowOps}
   */
  via(flow) {
    throw new Error('Not implemented');
  }

  _viaStage(stageProvider) {
    return this.via(Flow._simple(stageProvider))
  }
}

export default class Flow extends FlowOps {

  static _simple(stageProvider) {
    return new Flow(() => Module.simpleFlow(stageProvider()))
  }

  /**
   * @param stageMethods
   * @returns {Flow}
   */
  static create(stageMethods) {
    return Flow._simple(() => new SimpleStage(stageMethods));
  }

  static empty() {
    return Flow._simple(() => new SimpleStage());
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static map(fn) {
    return Flow.create({
      onPush() {
        this.push(fn(this.grab()))
      },
    });
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static filter(fn) {
    return Flow.create({
      onPush() {
        const x = this.grab();
        if (fn(x)) {
          this.push(x)
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
    return Flow._simple(() => new Scan(fn, zero));
  }

  /**
   * @param fn
   * @returns {Flow}
   */
  static mapConcat(fn) {
    return Flow._simple(() => new MapConcat(fn));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static grouped(n) {
    return Flow._simple(() => new Grouped(n));
  }

  /**
   * @param {number} n
   * @param {number} step
   * @returns {Flow}
   */
  static sliding(n, step = 1) {
    return Flow._simple(() => new Sliding(n, step));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static take(n) {
    return Flow._simple(() => new Take(n));
  }

  /**
   * @param {number} n
   * @returns {Flow}
   */
  static drop(n) {
    return Flow._simple(() => new Drop(n));
  }

  /**
   * @param {number} duration
   * @returns {Flow}
   */
  static delay(duration) {
    return Flow._simple(() => new Delay(duration));
  }

  /**
   * @param {Source|SourceStage} source
   * @returns {Flow}
   */
  static concat(source) {
    return new Flow(() => {
      return Module.merge(
        Module.simpleFlow(new SimpleStage()),
        source._materialize()
      ).wire(Module.simpleFlow(new Concat()));
    });
  }

  /**
   * @param {Source|SourceStage} source
   * @returns {Flow}
   */
  static zip(source) {
    return new Flow(() => {
      return Module.merge(
        Module.simpleFlow(new SimpleStage()),
        source._materialize()
      ).wire(Module.simpleFlow(new Zip()));
    });
  }

  constructor(materializer) {
    super(materializer);
  }

  /**
   * @param {Flow} flow
   * @returns {Flow}
   */
  via(flow) {
    return this._wire(flow, Flow);
  }

  /**
   * @param {Sink} sink
   * @returns {Sink}
   */
  to(sink) {
    return this._wire(sink, Sink);
  }

  /**
   * @param {Source} source
   * @returns {Flow}
   */
  concat(source) {
    return this.via(Flow.concat(source));
  }

  /**
   * @param {Source} source
   * @returns {Flow}
   */
  zip(source) {
    return this.via(Flow.zip(source));
  }

  /**
   * @param {Sink...} sinks
   * @returns {Sink}
   */
  broadcast(...sinks) {
    return this.to(Sink.broadcast(...sinks));
  }

  /**
   * @param {Sink...} sinks
   * @returns {Sink}
   */
  balance(...sinks) {
    return this.to(Sink.balance(...sinks));
  }
}

class Scan extends SimpleStage {
  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush() {
    this.acc = this.fn(this.acc, this.grab());
    this.push(this.acc);
  }
}

class MapConcat extends SimpleStage {
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

  onPush() {
    this.current = this.fn(this.grab());
    this._pushNextOrPull();
  }

  onPull() {
    this._pushNextOrPull();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
    }
  }

  _pushNextOrPull() {
    if (this.current) {
      this.push(this.current[this.index++]);
      if (this.index >= this.current.length) {
        this.current = null;
        this.index = 0;
      }
    } else if (!this.inputs[0].isClosed()) {
      this.pull();
    } else {
      this.complete();
    }
  }
}

class Grouped extends SimpleStage {
  constructor(size) {
    super();
    this.size = size;
  }

  /**
   * @type {Array}
   */
  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onComplete() {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

class Sliding extends SimpleStage {
  constructor(size, step = 1) {
    super();
    this.size = size;
    this.step = step;
  }

  pendingData = false;

  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
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

  onComplete() {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

class Take extends SimpleStage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.completeStage();
    }
  }
}

class Drop extends SimpleStage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(this.grab());
    }
  }
}

export class Delay extends SimpleStage {

  constructor(duration) {
    super();
    this.duration = duration;
  }

  currentTimeout = null;
  pendingComplete = false;

  onPush() {
    this.currentTimeout = setTimeout(() => {
      this.push(this.grab());
      if (this.pendingComplete) {
        this.complete();
      }
      this.currentTimeout = null;
    }, this.duration);
  }

  onComplete() {
    if (!this.currentTimeout) {
      this.complete();
    } else {
      this.pendingComplete = true;
    }
  }

  onCancel() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.cancel();
  }
}

export class Concat extends FanInStage {

  sourceIndex = 0;

  createInHandler(index) {
    return {
      onPush: () => {
        this.push(this.inputs[index].grab())
      },
      onComplete: () => {
        this.sourceIndex++;
        if (this.sourceIndex >= this.inputs.length) {
          this.complete();
        } else if (this.isOutputAvailable()) {
          this.inputs[this.sourceIndex].pull();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs[this.sourceIndex].pull();
  }

  onCancel() {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}

export class Zip extends FanInStage {

  createInHandler(index) {
    return {
      onPush: () => {
        if (this.inputs.every(i => i.isAvailable())) {
          this.push(this.inputs.map(i => i.grab()));

          if (this.inputs.some(i => i.isClosed())) {
            this.completeStage();
          }
        }
      },
      onComplete: () => {
        if (!this.isOutputClosed() && !this.inputs[index].isAvailable()) {
          this.completeStage();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs.forEach(i => i.pull());
  }

  onCancel() {
    this.cancelAll();
  }
}
