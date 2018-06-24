import { _registerSink, BasicSinkStage, Sink , sink } from '../core/sink'

export function reduce<I, R>(fn: (acc: R, x: I) => R, zero: R): Sink<I, R> {
  return sink(() => new Reduce(fn, zero))
}

declare module 'core/source' {
  interface Source<O> {
    runReduce<R>(fn: (acc: R, x: O) => R, zero: R): Promise<R>
  }
}

_registerSink('reduce', reduce)

class Reduce<I, R> extends BasicSinkStage<I, R> {

  constructor(private readonly fn: (acc: R, x: I) => R, zero: R) {
    super()
    this.result = zero
  }

  onNext(x: I): void {
    this.result = this.fn(this.result, x);
  }

  onComplete(): void {
    this.complete();
  }
}
