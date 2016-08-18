
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param fn
 * @param zero
 * @returns {Flow}
 */
export function scan(fn, zero) {
  return create(() => new Scan(fn, zero));
}

_registerFlow('scan', scan);

class Scan extends Stage {
  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush() {
    this.acc = this.fn(this.acc, this.grab());
    this.push(this.acc);
  }
}