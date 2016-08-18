
import { createSimple, _registerFlow } from '../core/flow';

/**
 * @param fn
 * @returns {Flow}
 */
export function filter(fn) {
  return createSimple({
    onPush() {
      const x = this.grab();
      if (fn(x)) {
        this.push(x)
      } else {
        this.pull();
      }
    },
  });
}

_registerFlow('filter', filter);
