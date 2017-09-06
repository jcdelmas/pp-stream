import { FanInStage, _registerSimpleFanIn } from '../core/fan-in';

/**
 *
 * @function zip
 *
 * @param {...Stream} sources
 * @return {Stream}
 *
 * @memberOf Source
 */

/**
 * @function zip
 *
 * @param {Stream} source
 * @return {Stream}
 *
 * @memberOf Flow
 * @memberOf Stream#
 */

/**
 * @function zip
 *
 * @param {number} size
 * @return {Stream}
 *
 * @memberOf FanIn
 */

/**
 * @function zipStreams
 * @return {Stream}
 *
 * @memberOf Stream#
 */

_registerSimpleFanIn('zip', 'zipStreams', size => new Zip(size));

class Zip extends FanInStage {

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.inputs.every(i => i.isAvailable())) {
          this.push(this.inputs.map(i => i.grab()));

          if (this.inputs.some(i => i.isClosed())) {
            this.finish();
          }
        }
      },
      onComplete: () => {
        if (!this.isOutputClosed() && !this.inputs[index].isAvailable()) {
          this.finish();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs.forEach(i => i.pull());
  }

  onCancel() {
    this.cancelAll();
  }
}