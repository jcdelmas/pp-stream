
import { BasicSinkStage, create, _registerSink } from '../core/sink';

/**
 * @param fn
 * @param zero
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function reduce(fn, zero) {
  return create(() => new Reduce(fn, zero));
}

_registerSink('reduce', reduce);

class Reduce extends BasicSinkStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.result = zero;
  }

  onNext(x) {
    this.result = this.fn(this.result, x);
  }

  onComplete() {
    this.complete();
  }
}
