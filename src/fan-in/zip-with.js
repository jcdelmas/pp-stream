import FanIn from '../core/fan-in'
import Stream from '../core/stream'

/**
 * @function zipWith
 *
 * @param fn
 * @return {Stream}
 *
 * @memberOf FanIn
 * @memberOf Stream#
 */
function zipWith(size, fn) {
  return FanIn.zip(size).map(xs => fn(...xs))
}

Stream.prototype.zipWith = function (fn) {
  return this.fanIn(size => zipWith(size, fn));
};
