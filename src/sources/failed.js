
import Source, { createSimple } from '../core/source';

/**
 * @returns {Stream}
 */
export function failed(error) {
  return createSimple({
    onPull() {
      this.error(error);
    }
  });
}

Source.failed = failed;