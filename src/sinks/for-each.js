
import { createBasic, _registerSink } from '../core/sink';

/**
 * @param cb
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function forEach(cb) {
  return createBasic({ onNext: cb });
}

_registerSink('forEach', forEach);
