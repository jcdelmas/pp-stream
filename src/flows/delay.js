
import Buffer, { OverflowStrategy } from '../core/buffer';
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {number} duration
 * @param bufferSize
 * @param overflowStrategy
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function delay(duration, bufferSize = 16, overflowStrategy = OverflowStrategy.FAIL) {
  return create(() => new Delay(duration, bufferSize, overflowStrategy));
}

/**
 * @param {number} duration
 * @returns {Stream}
 */
export function debounce(duration) {
  return create(() => new Delay(duration, 1, OverflowStrategy.DROP_BUFFER));
}

_registerFlow('delay', delay);
_registerFlow('debounce', debounce);


export class Delay extends Stage {

  constructor(duration, bufferSize = 16, overflowStrategy = OverflowStrategy.FAIL) {
    super();
    this.duration = duration;
    this.buffer = new Buffer(bufferSize, overflowStrategy, v => v.cancel());
    this.overflowStrategy = overflowStrategy;
  }

  doStart() {
    this.pull();
  }

  onPush() {
    this.buffer.push(new DelayedValue(this.grab(), this.duration, () => {
      if (this.isOutputAvailable()) {
        this.pushNext();
        if (this.overflowStrategy === OverflowStrategy.BACK_PRESSURE) {
          this.pullIfAllowed();
        }
      }
    }));
    if (this.overflowStrategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
      this.pullIfAllowed();
    }
  }

  onComplete() {
    if (this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onCancel() {
    this.buffer.drain().forEach(v => v.cancel());
    this.cancel();
  }

  onPull() {
    if (!this.buffer.isEmpty() && this.buffer.head().completed) {
      this.pushNext();
    }
  }

  pushNext() {
    this.push(this.buffer.pull().value);
    if (this.buffer.isEmpty() && this.isInputClosed()) {
      this.complete();
    }
  }
}

class DelayedValue {

  completed = false;

  constructor(value, duration, handler) {
    this.value = value;
    this.timeout = setTimeout(() => {
      this.completed = true;
      handler();
    }, duration);
  }

  cancel() {
    clearTimeout(this.timeout);
  }
}
