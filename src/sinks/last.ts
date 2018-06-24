import { _registerSink, Sink, BasicSinkStage , sink } from '../core/sink'

export function last<I>(): Sink<I, I | undefined> {
  return sink(() => new Last<I>())
}

declare module 'core/source' {
  interface Source<O> {
    runLast(): Promise<O>
  }
}

_registerSink('last', last);

class Last<I> extends BasicSinkStage<I, I | undefined> {
  onNext(x: I) {
    this.result = x
  }
}
