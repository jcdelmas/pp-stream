import { _registerSink, Sink, BasicSinkStage, sink } from '../core/sink'

export function ignore(): Sink<any, void> {
  return sink(() => new Ignore())
}

declare module 'core/source' {
  interface Source<O> {
    runIgnore(): Promise<void>
  }
}

_registerSink('ignore', ignore)

class Ignore extends BasicSinkStage<any, void> {
  onNext(): void {}
}