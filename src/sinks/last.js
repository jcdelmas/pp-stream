
import { _registerSink } from '../core/sink';
import { reduce } from './reduce';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function last() {
  return reduce((last, x) => x);
}

_registerSink('last', last);
