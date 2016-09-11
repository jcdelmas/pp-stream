
import Source, { create, SourceStage } from '../core/source';

/**
 * @param {Promise} promise
 * @return {Stream}
 */
export function fromPromise(promise) {
  return create(() => new PromiseSource(promise));
}

Source.fromPromise = fromPromise;

class PromiseSource extends SourceStage {

  constructor(promise) {
    super();
    this.promise = promise;
  }

  onPull() {
    this.promise.then(
      x => this.pushAndComplete(x),
      err => this.error(err)
    )
  }
}
