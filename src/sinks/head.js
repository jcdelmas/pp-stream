"use strict";

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
    onComplete() {
      this.error(new Error('No element found'));
    }
  });
}

_registerSink('head', head);
