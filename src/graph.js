
import Module from './module';

export default class Graph {

  /**
   * @param materializer
   */
  constructor(materializer) {
    if (typeof materializer !== 'function') {
      throw new Error('Invalid materializer');
    }
    this._materializer = materializer;
  }

  /**
   * @param {Graph} graph
   * @param classConstructor
   */
  _wire(graph, classConstructor) {
    if (!(graph instanceof Graph)) {
      throw new Error('Invalid graph argument: ' + graph);
    }
    return new classConstructor(() => {
      return this._materialize().wire(graph._materialize())
    });
  }

  /**
   * @returns {Module}
   */
  _materialize() {
    return this._materializer();
  }
}