import { _registerFlow, Flow, FlowStage } from '../core/flow'
import { SinkStage } from '../core/sink'
import { Source } from '../core/source'

export function flatMapConcat<I, O>(fn: (x: I) => Source<O, any>) {
  return Flow.fromStageFactory(() => new FlatMapConcat<I, O>(fn));
}

_registerFlow('flatMapConcat', flatMapConcat);

class FlatMapConcat<I, O> extends FlowStage<I, O, void> {
  constructor(private readonly fn: (x: I) => Source<O, void>) {
    super()
  }

  current?: SinkStage<O, void>
  completePending: boolean = false;

  onPush() {
    const source = this.fn(this.grab());
    this.current = new FlatMapSink<O>(this)
    source.runWithLastStage(this.current);
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
      this.current.finish()
    }
    this.cancel();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
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

  onStart() {
    this.pull()
  }
}
