
import { createSimple, _registerSink } from '../core/sink';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function head() {
  return createSimple({
    onPush() {
      this.result = this.grab();
      this.complete();
    },
    onStart() {
      this.pull();
    }
  });
}

_registerSink('head', head);
