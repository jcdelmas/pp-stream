"use strict";
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
function zipWith(fn) {
  return FanIn.zip().map(xs => fn(...xs))
}

Stream.prototype.zipWith = function (fn) {
  return this.pipe(zipWith(fn));
};
