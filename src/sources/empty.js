
import Source, { createSimple } from '../core/source';

/**
 * @returns {Stream}
 */
export function empty() {
  return createSimple({
    onPull() {
      this.complete();
    }
  });
}

Source.empty = empty;