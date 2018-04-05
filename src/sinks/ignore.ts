import { _registerSink, Sink, BasicSinkStage } from '../core/sink'

export function ignore(): Sink<any, Promise<void>> {
  return Sink.fromStageFactory(() => new Ignore())
}

_registerSink('ignore', ignore)

class Ignore extends BasicSinkStage<any, void> {
  onNext(): void {}
}