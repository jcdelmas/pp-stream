export default class Graph {

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
