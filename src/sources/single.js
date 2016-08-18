
import Source, { createSimple } from '../core/source';

/**
 * @returns {Stream}
 */
export function single(x) {
  return createSimple({
    onPull() {
      this.pushAndComplete(x);
    }
  });
}

Source.single = single;
