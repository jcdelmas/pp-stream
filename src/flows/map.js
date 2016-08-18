
import { createSimple, _registerFlow } from '../core/flow';

/**
 * @param fn
 * @returns {Flow}
 */
export function map(fn) {
  return createSimple({
    onPush() {
      this.push(fn(this.grab()))
    },
  });
}

_registerFlow('map', map);
