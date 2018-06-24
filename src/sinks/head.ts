import { _registerSink, Sink, SinkStage, sink } from '../core/sink'

export function head<I>(): Sink<I, I | undefined> {
  return sink(() => new Head<I>())
}

declare module 'core/source' {
  interface Source<O> {
    runHead(): Promise<O>
  }
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