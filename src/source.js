import { Stage, SourceStage } from './stage';
import Flow, { FlowOps, Concat, Zip } from './flow';
import Sink from './sink';
import RunnableGraph from './runnable-graph';

export default class Source extends FlowOps {

  /**
   * @param items
   * @returns {Source}
   */
  static from(items) {
    let index = 0;
    return Source.create({
      onPull() {
        if (index < items.length) {
          this.push(items[index++]);
        }
        if (index == items.length) {
          this.complete();
        }
      }
    });
  }

  static create(methods) {
    return new Source(new SourceStage(methods));
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
    const concat = new Concat();
    sources.forEach(s => s._subscribe(concat));
    return new Source(concat);
  }

  /**
   * @param {Source[]|SourceStage[]} sources
   * @returns {Flow}
   */
  static zip(...sources) {
    const zip = new Zip();
    sources.forEach(s => s._subscribe(zip));
    return new Source(zip);
  }

  /**
   * @param {Stage} first
   * @param {Stage?} last
   */
  constructor(first, last) {
    super(first, last || first);
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
   * @param {GraphInterface} flow
   * @returns {Source}
   */
  via(flow) {
    return this._wire(flow, Source);
  }

  /**
   * @param {GraphInterface} sink
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
