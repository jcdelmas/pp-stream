import { Stage } from './stage';
import Stream from './stream';

/**
 * @param stageFactory
 * @return {Stream}
 */
export function create(stageFactory) {
  return Stream.fromStageFactory(stageFactory);
}

/**
 * @param stageMethods
 * @returns {Stream}
 */
export function createSimple(stageMethods = {}) {
  return create(() => new Stage(stageMethods));
}

export function fromGraph(factory) {
  return Stream.fromGraph(1, 1, builder => {
    const result = factory(builder);
    return { inputs: [result.input], outputs: [result.output] }
  });
}

const Flow = createSimple();

Flow.create = create;
Flow.createSimple = createSimple;
Flow.fromGraph = fromGraph;

export function _registerFlow(name, fn) {
  Stream.prototype[name] = function (...args) {
    return this.pipe(fn(...args));
  };
}

export default Flow;
