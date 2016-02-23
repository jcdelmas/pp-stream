/**
 * @interface GraphInterface
 */

/**
 * @function
 * @name GraphInterface#_subscribe
 * @param {GraphInterface} subscriber
 */

/**
 * @function
 * @name GraphInterface#_nextHandler
 * @returns {InHandler}
 */

/**
 * @function
 * @name GraphInterface#_onSubscribe
 * @returns {Inlet}
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
    this._subscribe(graph);
    return new classConstructor(this, graph);
  }

  _subscribe(subscriber) {
    return this._last._subscribe(subscriber);
  }

  _nextHandler() {
    return this._first._nextHandler();
  }

  _onSubscribe(input) {
    return this._first._onSubscribe(input);
  }

  /**
   * @returns {SinkStage}
   */
  _getLastStage() {
    return this._last._getLastStage();
  }
}