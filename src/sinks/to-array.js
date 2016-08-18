
import { _registerSink } from '../core/sink';
import { reduce } from './reduce';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function toArray() {
  return reduce((xs, x) => xs.concat([x]), []);
}

_registerSink('toArray', toArray);
