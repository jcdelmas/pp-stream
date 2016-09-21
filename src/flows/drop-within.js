
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {int} duration
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function dropWithin(duration) {
  return create(() => new DropWithin(duration));
}

_registerFlow('dropWithin', dropWithin);

export class DropWithin extends Stage {

  constructor(duration) {
    super();
    this.duration = duration;
    this.timeoutReached = false;
  }

  doStart() {
    this.timeout = setTimeout(() => {
      this.timeoutReached = true;
    }, this.duration);
  }

  onPush() {
    if (this.timeoutReached) {
      this.push(this.grab());
    } else {
      this.pull();
    }
  }

  doFinish() {
    if (!this.timeoutReached) {
      clearTimeout(this.timeout);
    }
  }
}
