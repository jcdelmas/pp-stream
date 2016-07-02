import { Stage, SinkStage, CompoundSinkStage } from './stage';
import { Broadcast, Balance } from './fan-out';
import Graph from './graph';
import Module from './module';
import _ from 'lodash';

export default class Sink extends Graph {

  /**
   * @param stageProvider
   * @returns {Sink}
   * @private
   */
  static _simple(stageProvider) {
    return new Sink(() => Module.sinkStage(stageProvider()))
  }

  static create(stageMethods) {
    return Sink._simple(() => new SinkStage(stageMethods));
  }

  static forEach(cb) {
    return Sink.create({
      onPush() {
        cb(this.grab());
        this.pull();
      }
    });
  }

  /**
   * @param {Sink...} sinks
   * @returns {Sink}
   */
  static broadcast(...sinks) {
    return new Sink(() => {
      return Module.flowStage(new Broadcast())
        .wire(Module.merge(...sinks.map(s => s._materialize())));
    });
  }

  /**
   * @param {Sink...} sinks
   * @returns {Sink}
   */
  static balance(...sinks) {
    return new Sink(() => {
      return Module.flowStage(new Balance())
        .wire(Module.merge(...sinks.map(s => s._materialize())));
    });
  }

  static reduce(fn, zero) {
    return Sink._simple(() => new Reduce(fn, zero));
  }

  static toList() {
    return Sink.reduce((xs, x) => xs.concat([x]), []);
  }

  constructor(materializer) {
    super(materializer);
  }

  _wire(graph, classConstructor) {
    throw new Error('Wiring is not allowed on sink');
  }
}

class BasicSinkStage extends SinkStage {

  onPush() {
    this.onNext(this.grab());
    this.pull();
  }

  onNext(x) {
    throw new Error('Not implemented');
  }
}

class Reduce extends BasicSinkStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onNext(x) {
    this.acc = this.fn(this.acc, x);
  }

  onComplete() {
    this.complete(this.acc);
  }
}