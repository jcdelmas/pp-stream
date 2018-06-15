import { _registerSink, Sink, SinkStage, createSink } from '../core/sink'

export function head<I>(): Sink<I, I | undefined> {
  return createSink(() => new Head<I>())
}

_registerSink('head', head);

class Head<I> extends SinkStage<I, I | undefined> {

  onPush() {
    this.result = this.grab();
    this.complete();
  }

  onStart() {
    this.pull();
  }
}