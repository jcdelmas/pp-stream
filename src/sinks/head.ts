import { _registerSink, Sink, SinkStage } from '../core/sink'

export function head<I>(): Sink<I> {
  return Sink.fromStageFactory(() => new Head<I>())
}

_registerSink('head', head);

class Head<I> extends SinkStage<I> {

  onPush() {
    this.result = this.grab();
    this.complete();
  }

  onStart() {
    this.pull();
  }
}