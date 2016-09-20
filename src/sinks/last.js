"use strict";

import { createBasic, _registerSink } from '../core/sink';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function last() {
  return createBasic({
    onNext(x) {
      this._last = x;
    },
    onComplete() {
      if (this._last) {
        this.resolve(this._last)
      } else {
        this.reject('No element found')
      }
    }
  });
}

_registerSink('last', last);
