import { fanInFlow, UniformFanInShape, UniformFanInStage } from '../core/fan-in'
import { Flow, Graph, Inlet, Source } from '../index'
import { combineSources } from '../sources/combine'

export function merge<A>(size: number = 2): Graph<UniformFanInShape<A, A>, void> {
  return new Graph<UniformFanInShape<A, A>, void>(() => new Merge<A>(size))
}

export function mergeSources<O>(...sources: Source<O>[]): Source<O> {
  return combineSources<O, O>(...sources)(merge)
}

declare module '../core/source' {
  interface Source<O> {
    merge(s: Source<O>): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    merge(s: Source<O>): Flow<I, O>
  }
}

Source.prototype.merge = function<O>(this: Source<O>, source: Source<O>) {
  return this.pipe(fanInFlow<O>(source, merge))
}

Flow.prototype.merge = function<I, O>(this: Flow<I, O>, source: Source<O>) {
  return this.pipe(fanInFlow<O>(source, merge))
}

class Merge<A> extends UniformFanInStage<A, A> {

  completedInputs = 0

  queue: Inlet<A>[] = []

  constructor(inCount: number) {
    super(inCount)
  }

  onStart() {
    this.shape.inputs.forEach(input => input.pullIfAllowed())
  }

  createDownstreamHandler(index: number) {
    return {
      onPush: () => {
        const input = this.input(index)
        if (this.isOutputAvailable()) {
          this.push(input.grab())
          input.pull()
        } else {
          this.queue.push(input)
        }
      },
      onComplete: () => {
        this.completedInputs++;
        if (this.completedInputs >= this.inCount) {
          this.complete();
        }
      },
      onError: (e: any) => this.error(e)
    };
  }

  onPull() {
    const input = this.queue.shift()
    if (input) {
      this.push(input.grab())
      input.pullIfAllowed()
    }
  }
}
