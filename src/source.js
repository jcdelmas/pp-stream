import { Stage, SourceStage, CompoundSinkStage } from './stage';
import Flow, { FlowOps, Concat, Zip } from './flow';
import Sink from './sink';
import Module from './module';
import RunnableGraph from './runnable-graph';

export default class Source extends FlowOps {

  static _simple(stageProvider) {
    return new Source(() => Module.simpleSource(stageProvider()))
  }

  static create(methods) {
    return Source._simple(() => new SourceStage(methods));
  }

  /**
   * @param items
   * @returns {Source}
   */
  static from(items) {
    return Source._simple(() => new ArraySourceStage(items));
  }

  /**
   * @returns {Source}
   */
  static empty() {
    return Source.create({
      onPull() {
        this.complete();
      }
    });
  }

  /**
   * @returns {Source}
   */
  static single(x) {
    return Source.create({
      onPull() {
        this.pushAndComplete(x);
      }
    });
  }

  /**
   * @returns {Source}
   */
  static repeat(x) {
    return Source.create({
      onPull() {
        this.push(x);
      }
    });
  }

  /**
   * @param {Source[]} sources
   */
  static concat(...sources) {
    return new Source(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wire(Module.simpleFlow(new Concat()));
    });
  }

  /**
   * @param {Source[]|SourceStage[]} sources
   * @returns {Source}
   */
  static zip(...sources) {
    return new Source(() => {
      return Module.merge(...sources.map(s => s._materialize()))
        .wire(Module.simpleFlow(new Zip()));
    });
  }

  constructor(materializer) {
    super(materializer);
  }

  /**
   * @param {Source|SourceStage} source
   * @returns {Source}
   */
  concat(source) {
    return Source.concat(this, source);
  }

  /**
   * @param {Source|SourceStage} source
   * @returns {Source}
   */
  zip(source) {
    return Source.zip(this, source);
  }

  /**
   * @param {Sink...} sinks
   * @returns {RunnableGraph}
   */
  broadcast(...sinks) {
    return this.to(Sink.broadcast(...sinks));
  }

  /**
   * @param {Sink...} sinks
   * @returns {RunnableGraph}
   */
  balance(...sinks) {
    return this.to(Sink.balance(...sinks));
  }

  /**
   * @param {Flow} flow
   * @returns {Source}
   */
  via(flow) {
    return this._wire(flow, Source);
  }

  /**
   * @param {Sink} sink
   * @returns {RunnableGraph}
   */
  to(sink) {
    return this._wire(sink, RunnableGraph);
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

  _nextHandler() {
    throw new Error('Not allowed on source');
  }

  _onSubscribe(input) {
    throw new Error('Not allowed on source');
  }
}

class ArraySourceStage extends SourceStage {

  index = 0;

  constructor(items) {
    super();
    this.items = items;
  }

  onPull() {
    if (this.index < this.items.length) {
      this.push(this.items[this.index++]);
    }
    if (this.index == this.items.length) {
      this.complete();
    }
  }
}