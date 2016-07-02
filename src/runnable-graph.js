import Graph from './graph';
import { SinkStage } from './stage';

export default class RunnableGraph extends Graph {

  constructor(materializer) {
    super(materializer);
  }

  /**
   * @returns {Promise}
   */
  run() {
    const promises = this._materialize().run();

    if (promises.length > 1) {
      return Promise.all(promises);
    } else {
      return promises[0];
    }
  }

  _wire(graph, classConstructor) {
    throw new Error('Wiring is not allowed for runnable graph');
  }

}
