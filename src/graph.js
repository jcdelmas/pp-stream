import { wire } from './stage';

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
 * @name GraphInterface#_nextOutput
 * @returns {OutHandler}
 */

/**
 * @function
 * @name GraphInterface#_nextInput
 * @returns {InHandler}
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
   * @param {GraphInterface} graph
   * @param classConstructor
   */
  _wire(graph, classConstructor) {
    wire(this, graph);
    return new classConstructor(this, graph);
  }

  _nextInput() {
    return this._first._nextInput();
  }

  _nextOutput() {
    return this._last._nextOutput();
  }

  _getLastStage() {
    return this._last._getLastStage();
  }
}