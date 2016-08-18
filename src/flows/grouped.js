
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {number} n
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function grouped(n) {
  return create(() => new Grouped(n));
}

_registerFlow('grouped', grouped);

class Grouped extends Stage {
  constructor(size) {
    super();
    this.size = size;
  }

  /**
   * @type {Array}
   */
  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onComplete() {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.complete();
  }
}
