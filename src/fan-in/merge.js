import { FanInStage, _registerSimpleFanIn } from '../core/fan-in';

/**
 *
 * @function merge
 *
 * @param {...Stream} sources
 * @return {Stream}
 *
 * @memberOf Source
 */

/**
 * @function merge
 *
 * @param {Stream} source
 * @return {Stream}
 *
 * @memberOf Flow
 * @memberOf Stream#
 */

/**
 * @function merge
 *
 * @return {Stream}
 *
 * @memberOf FanIn
 */

/**
 * @function mergeStreams
 * @return {Stream}
 *
 * @memberOf Stream#
 */

_registerSimpleFanIn('merge', 'mergeStreams', () => new Merge());

class Merge extends FanInStage {

  completedInputs = 0;

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.isOutputAvailable()) {
          this.push(this.inputs[index].grab())
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inputs.length) {
          this.complete();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    const availableInput = this.inputs.find(input => input.isAvailable());
    if (availableInput) {
      this.push(availableInput.grab());
      if (!availableInput.isClosed()) {
        availableInput.pull();
      }
    } else {
      this.inputs.forEach(input => {
        if (input.canBePulled()) {
          input.pull();
        }
      });
    }
  }

  onCancel() {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}
