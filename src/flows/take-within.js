
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {int} duration
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function takeWithin(duration) {
  return create(() => new TakeWithin(duration));
}

_registerFlow('takeWithin', takeWithin);

export class TakeWithin extends Stage {

  constructor(duration) {
    super();
    this.duration = duration;
    this.timeoutReached = false;
  }

  doStart() {
    this.timeout = setTimeout(() => {
      this.timeoutReached = true;
      this.finish();
    }, this.duration);
  }

  doFinish() {
    if (!this.timeoutReached) {
      clearTimeout(this.timeout);
    }
  }
}
