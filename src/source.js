import Stage from './stage';
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
    return new Source(new Stage({
      onPull() {
        this.finish();
      }
    }));
  }

  /**
   * @param {Stage} last
   */
  constructor(first, last) {
    super(first, last || first);
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

class ListSource extends Stage {
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
