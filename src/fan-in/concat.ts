import { fanInFlow, UniformFanInShape, UniformFanInStage } from '../core/fan-in'
import { DownstreamHandler } from '../core/stage'
import { Flow, Graph, Source } from '../'
import { combineSources } from '../sources/combine'

export function concat<A>(size: number = 2): Graph<UniformFanInShape<A, A>, void> {
  return new Graph<UniformFanInShape<A, A>, void>(() => new Concat<A>(size))
}

export function concatSources<O>(...sources: Source<O>[]): Source<O> {
  return combineSources<O, O>(...sources)(concat)
}

declare module '../core/source' {
  interface Source<O> {
    concat(s: Source<O>): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    concat(s: Source<O>): Flow<I, O>
  }
}

Source.prototype.concat = function<O>(this: Source<O>, source: Source<O>) {
  return this.pipe(fanInFlow<O>(source, concat))
}

Flow.prototype.concat = function<I, O>(this: Flow<I, O>, source: Source<O>) {
  return this.pipe(fanInFlow<O>(source, concat))
}

export class Concat<A> extends UniformFanInStage<A, A> {

  sourceIndex: number = 0;

  constructor(inCount: number) {
    super(inCount)
  }

  createDownstreamHandler(index: number): DownstreamHandler {
    return {
      onPush: () => {
        this.push(this.input(index).grab())
      },
      onComplete: () => {
        this.sourceIndex++
        if (this.sourceIndex >= this.inCount) {
          this.complete()
        } else if (this.isOutputAvailable()) {
          this.shape.inputs[this.sourceIndex].pull()
        }
      },
      onError: e => this.error(e)
    }
  }

  onPull(): void {
    this.input(this.sourceIndex).pull()
  }
}
