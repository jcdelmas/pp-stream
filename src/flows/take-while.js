
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {function} fn
 * @returns {Flow}
 */
export function takeWhile(fn) {
  return create(() => new TakeWhile(fn));
}

_registerFlow('takeWhile', takeWhile);

export class TakeWhile extends Stage {

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
    const v = this.grab();
    if (this.fn(v)) {
      this.push(v);
    } else {
      this.finish();
    }
  }
}
