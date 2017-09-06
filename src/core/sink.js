import { Stage } from './stage';
import Stream from './stream';

/**
 * @param stageFactory
 * @returns {Stream}
 */
export function create(stageFactory) {
  return Stream.fromSinkStageFactory(stageFactory);
}

/**
 * @param stageMethods
 * @return {Stream}
 */
export function createSimple(stageMethods) {
  return create(() => new SinkStage(stageMethods));
}

export function fromGraph(factory) {
  return Stream.fromGraph(1, 0, builder => ({ inputs: [factory(builder)] }));
}

const Sink = {
  create,
  createSimple,
  fromGraph
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
    super({ ...methods, outputs: 0 });
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
