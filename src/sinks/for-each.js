
import { createSimple, _registerSink } from '../core/sink';

/**
 * @param cb
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function forEach(cb) {
  return createSimple({
    onPush() {
      cb(this.grab());
      this.pull();
    },
    onStart() {
      this.pull();
    }
  });
}

_registerSink('forEach', forEach);
