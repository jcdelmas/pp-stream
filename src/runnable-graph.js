import Graph from './graph';
import { SinkStage } from './stage';

export default class RunnableGraph extends Graph {

  /**
   * @param {SinkStage} last
   */
  constructor(first, last) {
    super(first, last || first);
  }

  /**
   * @returns {Promise}
   */
  run() {
    this.last().pull();
    return this.last().getResult();
  }

  wire(graph, classConstructor) {
    throw new Error('Wiring is not allowed for runnable graph');
  }

}
