import { Stage } from './stage';
import Stream from './stream';

/**
 * @param stageProvider
 * @returns {Stream}
 */
export function create(stageProvider) {
  return Stream.fromSourcedMaterializer(source => source._materialize().wireSink(stageProvider()));
}

/**
 * @param stageMethods
 * @return {Stream}
 */
export function createSimple(stageMethods) {
  return create(() => new SinkStage(stageMethods));
}

const Sink = {
  create,
  createSimple
};

export function _registerSink(name, fn) {
  Sink[name] = fn;
  Stream.prototype[name] = function (...args) {
    return this.runWith(fn(...args));
  };
}

export default Sink;

export class SinkStage extends Stage {

  constructor(methods = {}) {
    super(methods);
    this.resultPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  onPush() {
    throw new Error('Not implemented');
  }

  complete(result) {
    this.cancel();
    this.resolve(result);
  }

  error(e) {
    this.cancel();
    this.reject(e);
  }

  _getResult() {
    return this.resultPromise;
  }

  // Not supported methods

  _addDownstreamStage(stage) {
    throw new Error('Not supported');
  }

  onStart() {
    throw new Error('Not supported');
  }

  onPull() {
    throw new Error('Not supported');
  }

  onCancel() {
    throw new Error('Not supported');
  }

  push(x) {
    throw new Error('Not supported');
  }

  pushAndComplete(x) {
    throw new Error('Not supported');
  }

  isOutputAvailable() {
    throw new Error('Not supported');
  }

  isOutputClosed() {
    throw new Error('Not supported');
  }
}

export class BasicSinkStage extends SinkStage {

  onPush() {
    this.onNext(this.grab());
    this.pull();
  }

  onNext(x) {
    throw new Error('Not implemented');
  }
}
