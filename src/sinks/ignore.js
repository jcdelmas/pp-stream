
import { _registerSink } from '../core/sink';
import { forEach } from './for-each';

/**
 * @return {Stream}
 *
 * @memberOf Sink
 * @memberOf Stream#
 */
export function ignore() {
  return forEach(() => {});
}

_registerSink('ignore', ignore);
