import { _registerFlow, Flow, FlowStage } from '../core/flow'
import { SinkStage } from '../core/sink'
import { Source } from '../core/source'

export function flatMapMerge<I, O>(fn: (x: I) => Source<O, void>, breadth: number = 16): Flow<I, O, void> {
  return Flow.fromStageFactory(() => new FlatMapMerge(fn, breadth))
}

_registerFlow('flatMapMerge', flatMapMerge);

class FlatMapMerge<I, O> extends FlowStage<I, O, void> {
  constructor(
    private readonly fn: (x: I) => Source<O, void>,
    private readonly breadth: number = 16
  ) {
    super()
  }

  stages: FlatMapSink<O>[] = [];

  completePending: boolean = false;

  onPush() {
    const source = this.fn(this.grab());

    const stage = new FlatMapSink(this)
    this.stages.push(stage);
    source.runWithLastStage(stage);

    if (this.stages.length < this.breadth) {
      this.pull();
    }
  }

  onPull() {
    if (this.stages.length > 0) {
      const availableStage = this.stages.find(stage => stage.isInputAvailable())
      if (availableStage) {
        this.push(availableStage.grab())
      }
      this.stages.forEach(stage => stage.pullIfAllowed())
    } else {
      this.pull()
    }
  }

  onCancel() {
    this.stages.forEach(stage => stage.cancel())
    this.cancel()
  }

  onComplete() {
    if (this.stages.length === 0) {
      this.complete()
    } else {
      this.completePending = true
    }
  }
}

class FlatMapSink<I> extends SinkStage<I, void> {

  constructor (private readonly parent: FlatMapMerge<any, I>) {
    super()
  }

  onPush() {
    this.parent.push(this.grab())
  }

  onComplete() {
    const i = this.parent.stages.indexOf(this);
    this.parent.stages.splice(i, 1);

    if (this.parent.completePending && this.parent.stages.length === 0) {
      this.parent.complete();
    } else if (!this.parent.isInputClosed()) {
      this.parent.pull();
    }
  }

  onStart() {
    this.pull();
  }

}
