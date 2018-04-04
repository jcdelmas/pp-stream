import { createFanIn, FanInStage } from '../core/fan-in';
import Stream from '../core/stream';
import { DownstreamHandler, Inlet } from '../core/stage'

export function interleaveFanIn<A>(size: number, segmentSize: number = 1): Stream<A, A> {
  return createFanIn<A, A>(size, () => new Interleave<A>(size, segmentSize));
}

declare module '../core/stream' {
  interface Stream<I, O> {
    interleave(source: Stream<never, O>, segmentSize: number): Stream<I, O>
    interleaveStreams(segmentSize: number): Stream<I, O>
  }
}

Stream.prototype.interleave = function<I, O>(this: Stream<I, O>, source: Stream<never, O>, segmentSize: number = 1): Stream<I, O> {
  return Stream.groupStreams([this, source]).fanIn(size => interleaveFanIn(size, segmentSize));
}

Stream.prototype.interleaveStreams = function<I, O>(this: Stream<I, O>, segmentSize: number = 1) {
  return this.fanIn(size => interleaveFanIn(size, segmentSize));
}

export function interleaveSources<O>(sources: Stream<never, O>[], segmentSize: number = 1): Stream<never, O> {
  return Stream.groupStreams(sources).interleaveStreams(segmentSize)
}

class Interleave<A> extends FanInStage<A, A> {

  constructor(size: number, private readonly segmentSize: number) {
    super(size)
  }

  completedInputs: number = 0
  currentInputIndex: number = 0
  count: number = 0

  createDownstreamHandler(index): DownstreamHandler<A> {
    return {
      onPush: () => {
        if (this.isOutputAvailable()) {
          this.push(this.inputs[index].grab());
          this.count++;
          if (this.count === this.segmentSize) {
            this._switchToNextInput();
          }
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inputs.length) {
          this.complete();
        } else if (this.currentInputIndex === index) {
          this._switchToNextInput();
          if (this.isOutputAvailable()) {
            this.currentInput().pull();
          }
        }
      },
      onError: e => this.error(e)
    };
  }

  _switchToNextInput(): void {
    this._incrementCurrentInput();
    while (this.currentInput().isClosed()) {
      this._incrementCurrentInput();
    }
    this.count = 0;
  }

  _incrementCurrentInput(): void {
    this.currentInputIndex = (this.currentInputIndex + 1) % this.inputs.length;
  }

  currentInput(): Inlet<I> {
    return this.inputs[this.currentInputIndex]
  }

  onPull(): void {
    this.currentInput().pullIfAllowed();
  }

  onCancel(): void {
    this.cancelAll();
  }
}
