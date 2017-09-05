import { Stage } from './stage';
import Stream from './stream';

/**
 * @param stageProvider
 * @return {Stream}
 */
export function create(stageProvider) {
  return Stream.fromFlowStageFactory(stageProvider);
}

/**
 * @param stageMethods
 * @returns {Stream}
 */
export function createSimple(stageMethods = {}) {
  return create(() => new Stage(stageMethods));
}

export function fromGraphBuilder(factory) {
  return Stream.fromGraphBuilder(builder => {
    const result = factory(builder);
    return { inputs: [result.input], outputs: [result.output] }
  });
}

const Flow = createSimple();

Flow.create = create;
Flow.createSimple = createSimple;
Flow.fromGraphBuilder = fromGraphBuilder;

export function _registerFlow(name, fn) {
  Stream.prototype[name] = function (...args) {
    return this.pipe(fn(...args));
  };
}

export default Flow;
