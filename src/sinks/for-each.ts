import { _registerSink, Sink, SinkStageWithPromise } from '../core/sink'

export function forEach<I>(cb: (x: I) => void): Sink<any, Promise<void>> {
  return Sink.fromStageFactory(() => new ForEach(cb))
}

_registerSink('forEach', forEach)

class ForEach<I> extends SinkStageWithPromise<I, undefined> {

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
