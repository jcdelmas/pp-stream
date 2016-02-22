import { Wire } from './stage';

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
    const output = this.last().nextOutput();
    const input = graph.first().nextInput();
    const wire = new Wire(output.handler, input.handler);
    output.setOutlet(wire);
    input.setInlet(wire);
    return new classConstructor(this.first(), graph.last());
  }

  first() {
    return this._first;
  }

  last() {
    return this._last;
  }
}