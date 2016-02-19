import Stage from './stage';
import Flow, { FlowOps } from './flow';
import Sink from './sink';
import Graph from './graph';

export default class Source extends FlowOps {

  /**
   * @param items
   * @returns {Source}
   */
  static from(items) {
    return new Source(new ListSource(items));
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
