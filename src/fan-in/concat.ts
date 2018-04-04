import { FanInStage, _registerSimpleFanIn } from '../core/fan-in';
import { DownstreamHandler } from '../core/stage'

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

_registerSimpleFanIn('concat', 'concatStreams', size => new Concat(size));

class Concat<A> extends FanInStage<A, A> {

  sourceIndex: number = 0;

  createDownstreamHandler(index: number): DownstreamHandler {
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

  onPull(): void {
    this.inputs[this.sourceIndex].pull();
  }

  onCancel(): void {
    this.inputs.slice(this.sourceIndex).forEach(input => input.cancel());
  }
}
