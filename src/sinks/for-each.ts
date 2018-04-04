
import { _registerSink, SinkStage, Sink } from '../core/sink'

export function forEach<I>(cb: (x: I) => void) {
  return Sink.fromStageFactory(() => new ForEach(cb))
}

_registerSink('forEach', forEach)

class ForEach<I> extends SinkStage<I> {

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
