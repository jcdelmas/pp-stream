
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {number} n
 * @param {number} step
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function sliding(n, step = 1) {
  return create(() => new Sliding(n, step));
}

_registerFlow('sliding', sliding);

class Sliding extends Stage {
  constructor(size, step = 1) {
    super();
    this.size = size;
    this.step = step;
  }

  pendingData = false;

  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length === this.size) {
      const newBuffer = this.buffer.slice(this.step);
      this.push(this.buffer);
      this.buffer = newBuffer;
      this.pendingData = false;
    } else {
      this.pull();
      this.pendingData = true;
    }
  }

  onComplete() {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.complete();
  }
}
