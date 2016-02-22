import Stage, { SinkStage } from './stage';
import Graph from './graph';

export default class Sink extends Graph {

  /**
   * @param {Stage} first
   * @param {SinkStage?} last
   */
  constructor(first, last) {
    super(first, last || first);
  }

  static create(stageMethods) {
    const stage = new SinkStage(stageMethods);
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
    return new Sink(new Reduce(fn, zero));
  }

  static toList() {
    return Sink.reduce((xs, x) => xs.concat([x]), []);
  }

  wire(graph, classConstructor) {
    throw new Error('Wiring is not allowed for sinks');
  }
}

class BasicSinkStage extends SinkStage {

  onPush(x) {
    this.onNext(x);
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

  onUpstreamFinish() {
    this.finish(this.acc);
  }
}