import { _registerSink, Sink, BasicSinkStage, createSink } from '../core/sink'

export function ignore(): Sink<any, void> {
  return createSink(() => new Ignore())
}

_registerSink('ignore', ignore)

class Ignore extends BasicSinkStage<any, void> {
  onNext(): void {}
}