import { Stage } from './stage';
import Stream from './stream';

/**
 * @param stageProvider
 * @return {Stream}
 */
export function create(stageProvider) {
  return Stream.fromSourceMaterializer(source => source._materialize().wireFlow(stageProvider()));
}

/**
 * @param stageMethods
 * @returns {Stream}
 */
export function createSimple(stageMethods) {
  return create(() => new Stage(stageMethods));
}

const Flow = {
  create,
  createSimple
};

export function _registerFlow(name, fn) {
  Flow[name] = fn;
  Stream.prototype[name] = function (...args) {
    return this.pipe(fn(...args));
  };
}

export default Flow;
