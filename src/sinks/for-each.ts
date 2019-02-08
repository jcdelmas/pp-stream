import { _registerSink, Sink, simpleSink } from '../core/sink'

export function forEach<I>(cb: (x: I) => void): Sink<I, void> {
  return simpleSink<I>(input => ({
    onPush() {
      cb(input.grab())
      input.pull()
    },
    onStart() {
      input.pull()
    }
  }))
}

declare module 'core/source' {
  interface Source<O> {
    runForEach(cb: (x: O) => void): Promise<void>
  }
}

_registerSink('forEach', forEach)
