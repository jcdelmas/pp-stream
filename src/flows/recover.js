
import { createSimple, _registerFlow } from '../core/flow';

/**
 * @param {function?} fn
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function recover(fn) {
  return createSimple({
    onError(e) {
      try {
        const result = fn ? fn(e) : undefined;
        if (typeof result !== 'undefined') {
          this.push(result);
        } else {
          this.pull();
        }
      } catch (e) {
        this.error(e);
      }
    },
  });
}

_registerFlow('recover', recover);
