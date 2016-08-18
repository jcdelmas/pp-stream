import { Stage } from './stage';
import Stream from './stream';

export function create(stageProvider) {
  return Stream.fromSourcedMaterializer(source => source._materialize().wireFlow(stageProvider()));
}

/**
 * @param stageMethods
 * @returns {Flow}
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
