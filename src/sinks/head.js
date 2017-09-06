
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
      this.complete(this.grab());
    },
    doStart() {
      this.pull();
    }
  });
}

_registerSink('head', head);
