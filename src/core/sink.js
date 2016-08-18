import { Stage } from './stage';

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

export class Reduce extends BasicSinkStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onNext(x) {
    this.acc = this.fn(this.acc, x);
  }

  onComplete() {
    this.complete(this.acc);
  }
}