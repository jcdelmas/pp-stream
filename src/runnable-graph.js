import Graph from './graph';
import { SinkStage } from './stage';

export default class RunnableGraph extends Graph {

  /**
   * @param {Stage} first
   * @param {SinkStage} last
   */
  constructor(first, last) {
    super(first, last || first);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const lastStage = this._getLastStage();
    lastStage.pull();
    return lastStage._getResult();
  }

  _wire(graph, classConstructor) {
    throw new Error('Wiring is not allowed for runnable graph');
  }

  _nextInput() {
    throw new Error('Not allowed on runnable graph');
  }

  _nextOutput() {
    throw new Error('Not allowed on runnable graph');
  }

}
