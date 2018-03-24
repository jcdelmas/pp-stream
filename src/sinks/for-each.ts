import { _registerSink, Sink , createSink } from '../core/sink'
import { SinkStage } from '..'

export function forEach<I>(cb: (x: I) => void): Sink<I, void> {
  return createSink(() => new ForEach(cb))
}

declare module 'core/source' {
  interface Source<O> {
    runForEach(cb: (x: O) => void): Promise<void>
  }
}

_registerSink('forEach', forEach)

class ForEach<I> extends SinkStage<I, void> {

  constructor(private readonly cb: (x: I) => void) {
    super()
  }
  
  onPush() {
    this.cb(this.grab());
    this.pull();
  }
  
  onStart() {
    this.pull();
  }
}
