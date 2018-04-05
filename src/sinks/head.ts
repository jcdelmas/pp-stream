import { _registerSink, Sink, SinkStageWithPromise } from '../core/sink'

export function head<I>(): Sink<I, Promise<I | undefined>> {
  return Sink.fromStageFactory(() => new Head<I>())
}

_registerSink('head', head);

class Head<I> extends SinkStageWithPromise<I, I | undefined> {

  onPush() {
    this.result = this.grab();
    this.complete();
  }

  onStart() {
    this.pull();
  }
}