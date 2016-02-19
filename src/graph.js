import { SinkStage } from './stage';

export default class Graph {

  /**
   * @param {SinkStage} last
   */
  constructor(last) {
    this.last = last;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this.last.pull();
    return this.last.getResult();
  }

}
