
import { createBasic, _registerSink } from '../core/sink';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function ignore() {
  return createBasic({ onNext() {} });
}

_registerSink('ignore', ignore);
