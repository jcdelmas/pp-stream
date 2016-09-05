import { FanInStage, _registerSimpleFanIn } from '../core/fan-in';

/**
 *
 * @function concat
 *
 * @param {...Stream} sources
 * @return {Stream}
 *
 * @memberOf Source
 */

/**
 * @function concat
 *
 * @param {Stream} source
 * @return {Stream}
 *
 * @memberOf Flow
 * @memberOf Stream#
 */

/**
 * @function concat
 *
 * @return {Stream}
 *
 * @memberOf FanIn
 */

/**
 * @function concatStreams
 * @return {Stream}
 *
 * @memberOf Stream#
 */

_registerSimpleFanIn('concat', 'concatStreams', () => new Concat());

class Concat extends FanInStage {

  sourceIndex = 0;

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        this.push(this.inputs[index].grab())
      },
      onComplete: () => {
        this.sourceIndex++;
        if (this.sourceIndex >= this.inputs.length) {
          this.complete();
        } else if (this.isOutputAvailable()) {
          this.inputs[this.sourceIndex].pull();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs[this.sourceIndex].pull();
  }

  onCancel() {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}
