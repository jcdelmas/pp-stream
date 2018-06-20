import { _registerFlow, createFlow, FlowStage } from 'core/flow'
import { SinkStage, createSink } from 'core/sink'
import { Source } from 'core/source'

export function flatMapConcat<I, O>(fn: (x: I) => Source<O>) {
  return createFlow(() => new FlatMapConcat<I, O>(fn));
}

declare module '../core/source' {
  interface Source<O> {
    flatMapConcat<O2>(fn: (x: O) => Source<O2>): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    flatMapConcat<O2>(fn: (x: O) => Source<O2>): Flow<I, O2>
  }
}

_registerFlow('flatMapConcat', flatMapConcat);

class FlatMapConcat<I, O> extends FlowStage<I, O> {
  constructor(private readonly fn: (x: I) => Source<O>) {
    super()
  }

  current?: SinkStage<O, void>
  completePending: boolean = false;

  onPush() {
    const source = this.fn(this.grab());
    this.current = new FlatMapSink<O>(this)
    source.runWith(createSink(() => this.current));
  }

  onPull() {
    if (this.current) {
      this.current.pullIfAllowed()
    } else {
      this.pull()
    }
  }

  onCancel() {
    if (this.current) {
      this.current.cancel()
    }
    this.cancel();
  }

  onComplete() {
    if (!this.current) {
      this.complete()
    } else {
      this.completePending = true;
    }
  }
}

class FlatMapSink<I> extends SinkStage<I, void> {

  constructor (private readonly parent: FlatMapConcat<any, I>) {
    super()
  }

  onPush() {
    this.parent.push(this.grab())
  }

  onComplete() {
    this.parent.current = undefined
    if (this.parent.completePending) {
      this.parent.complete()
    }
  }

  onError(e: any): void {
    this.parent.error(e)
  }

  onStart() {
    this.pull()
  }
}
