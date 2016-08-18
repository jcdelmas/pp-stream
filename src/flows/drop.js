
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {number} n
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function drop(n) {
  return create(() => new Drop(n));
}

_registerFlow('drop', drop);

class Drop extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(this.grab());
    }
  }
}
