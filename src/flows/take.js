
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {number} n
 * @returns {Flow}
 */
export function take(n) {
  return create(() => new Take(n));
}

_registerFlow('take', take);

export class Take extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.finish();
    }
  }
}
