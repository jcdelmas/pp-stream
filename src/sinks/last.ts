import { _registerSink, Sink, BasicSinkStage } from '../core/sink'

export function last<I>(): Sink<I, Promise<I | undefined>> {
  return Sink.fromStageFactory(() => new Last<I>())
}

_registerSink('last', last);

class Last<I> extends BasicSinkStage<I, I | undefined> {
  onNext(x: I) {
    this.result = x
  }
}
