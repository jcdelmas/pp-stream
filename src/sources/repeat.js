
import Source, { createSimple } from '../core/source';

/**
 * @returns {Stream}
 */
export function repeat(x) {
  return createSimple({
    onPull() {
      this.push(x);
    }
  });
}

Source.repeat = repeat;
