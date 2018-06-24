import { fanInFlow, UniformFanInShape, UniformFanInStage } from 'core/fan-in'
import { DownstreamHandler, Inlet } from 'core/stage'
import { Graph } from 'core/graph'
import { Source } from 'core/source'
import { Flow } from 'core/flow'
import { combineSources } from 'sources/combine'

export function interleave<A>(segmentSize: number = 1): (size: number) => Graph<UniformFanInShape<A, A>, void> {
  return size => new Graph<UniformFanInShape<A, A>, void>(() => new Interleave<A>(size, segmentSize))
}

export function interleaveSources<O>(segmentSize: number = 1): (...sources: Source<O>[]) => Source<O> {
  return (...sources: Source<O>[]) => combineSources<O, O>(...sources)(interleave(segmentSize))
}

export function interleaveWith<O>(source: Source<O>, segmentSize: number = 1): Flow<O, O> {
  return fanInFlow<O>(source, interleave(segmentSize))
}

declare module '../core/source' {
  interface Source<O> {
    interleave(s: Source<O>, segmentSize?: number): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    interleave(s: Source<O>, segmentSize: number): Flow<I, O>
  }
}

Source.prototype.interleave = function<O>(this: Source<O>, source: Source<O>, segmentSize: number = 1) {
  return this.pipe(interleaveWith(source, segmentSize))
}

Flow.prototype.interleave = function<I, O>(this: Flow<I, O>, source: Source<O>, segmentSize: number = 1) {
  return this.pipe(interleaveWith(source, segmentSize))
}

class Interleave<A> extends UniformFanInStage<A, A> {

  constructor(inCount: number, private readonly segmentSize: number) {
    super(inCount)
  }

  completedInputs: number = 0
  currentInputIndex: number = 0
  count: number = 0

  createDownstreamHandler(index: number): DownstreamHandler {
    return {
      onPush: () => {
        if (this.isOutputAvailable()) {
          this.push(this.input(index).grab());
          this.count++;
          if (this.count === this.segmentSize) {
            this._switchToNextInput();
          }
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inCount) {
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
    this.currentInputIndex = (this.currentInputIndex + 1) % this.inCount;
  }

  currentInput(): Inlet<A> {
    return this.input(this.currentInputIndex)
  }

  onPull(): void {
    this.currentInput().pullIfAllowed();
  }
}
