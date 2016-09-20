
import { SinkStage, create, _registerSink } from '../core/sink';

/**
 * @param fn
 * @param zero
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function reduceAsync(fn, zero) {
  return create(() => new ReduceAsync(fn, zero));
}

_registerSink('reduceAsync', reduceAsync);

class ReduceAsync extends SinkStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
    this.pending = false;
  }

  onPush() {
    this.pending = true;
    this.fn(this.acc, this.grab()).then(acc => {
      this.pending = false;
      this.acc = acc;
      if (this.isInputClosed()) {
        this.complete(this.acc);
      } else {
        this.pull();
      }
    });
  }

  onComplete() {
    if (!this.pending) {
      this.complete(this.acc);
    }
  }
}
