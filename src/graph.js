/**
 * @interface StageInterface
 */

/**
 * @function
 * @name GraphInterface#wireInput
 * @param {StageInterface}
 * @returns
 */

/**
 * @function
 * @name GraphInterface#wireOutput
 * @param {StageInterface}
 * @returns
 */

/**
 * @interface GraphInterface
 */

/**
 * @function
 * @name GraphInterface#first
 * @returns {StageInterface}
 */

/**
 * @function
 * @name GraphInterface#last
 * @returns {StageInterface}
 */

/**
 * @implements {GraphInterface}
 */
export default class Graph {

  constructor(first, last) {
    this._first = first;
    this._last = last || first;
  }

  /**
   * @param {Graph} graph
   * @param classConstructor
   */
  wire(graph, classConstructor) {
    this.last().wireOutput(graph.first());
    graph.first().wireInput(this.last());
    return new classConstructor(this.first(), graph.last());
  }

  first() {
    return this._first;
  }

  last() {
    return this._last;
  }
}