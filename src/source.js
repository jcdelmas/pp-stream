import { Stage, SourceStage, InHandler, OutHandler } from './stage';
import Flow, { FlowOps } from './flow';
import Sink from './sink';
import RunnableGraph from './runnable-graph';

export default class Source extends FlowOps {

  /**
   * @param items
   * @returns {Source}
   */
  static from(items) {
    return new Source(new ListSource(items));
  }

  /**
   * @returns {Source}
   */
  static empty() {
    return new Source(new SourceStage({
      onPull() {
        this.complete();
      }
    }));
  }

  /**
   * @param {Source[]} sources
   */
  static concat(...sources) {
    return new Source(new Concat(sources));
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
   * @param {Flow|Stage} flow
   * @returns {Source}
   */
  via(flow) {
    return this.wire(flow, Source);
  }

  /**
   * @param {Sink|Stage} sink
   * @returns {RunnableGraph}
   */
  to(sink) {
    return this.wire(sink, RunnableGraph);
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

class ListSource extends SourceStage {
  constructor(items) {
    super();
    this.index = 0;
    this.items = items;
  }

  onPull() {
    if (this.index < this.items.length) {
      this.push(this.items[this.index++]);
    } else {
      this.complete();
    }
  }
}

class Concat extends Stage {
  /**
   * @param {Source[]} sources
   */
  constructor(sources) {
    super();
    sources.forEach(source => source.via(this));
  }

  sourceIndex = 0;

  createInHandler(index) {
    return {
      onPush: x => {
        this.outputs[0].push(x)
      },
      onUpstreamFinish: () => {
        this.sourceIndex++;
        if (this.sourceIndex >= this.inputs.length) {
          this.outputs[0].complete();
        } else if (this.outputs[0].isAvailable()) {
          this.inputs[this.sourceIndex].pull();
        }
      },
      onError: e => this.outputs[0].onError(e)
    };
  }

  createOutHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist')
    }
    return {
      onPull: () => this.inputs[this.sourceIndex].pull(),
      onDownstreamFinish: () => this.inputs.slice(this.sourceIndex).forEach(input => input.cancel())
    };
  }
}
