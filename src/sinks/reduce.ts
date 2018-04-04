import { _registerSink, BasicSinkStage, Sink } from '../core/sink'

export function reduce<I, R>(fn: (acc: R, x: I) => R, zero: R): Sink<I> {
  return Sink.fromStageFactory(() => new Reduce(fn, zero))
}

_registerSink('reduce', reduce)

class Reduce<I, R> extends BasicSinkStage<I> {

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
