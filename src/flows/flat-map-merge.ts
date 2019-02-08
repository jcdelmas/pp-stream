import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'
import { SinkStage, sink } from 'core/sink'
import { Source } from 'core/source'
import { simpleSink, Sink } from '..'

export function flatMapMerge<I, O>(fn: (x: I) => Source<O>, breadth: number = 16): Flow<I, O> {
  return flow(() => new FlatMapMerge(fn, breadth))
}

declare module '../core/source' {
  interface Source<O> {
    flatMapMerge<O2>(fn: (x: O) => Source<O2>, breadth?: number): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    flatMapMerge<O2>(fn: (x: O) => Source<O2>, breadth?: number): Flow<I, O2>
  }
}

_registerFlow('flatMapMerge', flatMapMerge);

class FlatMapMerge<I, O> extends FlowStage<I, O> {
  constructor(
    private readonly fn: (x: I) => Source<O>,
    private readonly breadth: number = 16
  ) {
    super()
  }

  sources: FlatMapSink<O>[] = [];
  queue: FlatMapSink<O>[] = [];

  sink: Sink<O, void> = simpleSink<O>(input => {
    const stage = new FlatMapSink(this)
    this.sources.push(input)
    return stage
  })

  onPush() {
    this.fn(this.grab()).runWith(this.sink)

    if (this.sources.length < this.breadth) {
      this.pull()
    }
  }

  onPull() {
    const source = this.queue.shift()
    if (source) {
      this.push(source.grab())
      source.pullIfAllowed()
    }
  }

  onCancel() {
    this.sources.forEach(stage => stage.cancel())
    this.cancel()
  }

  onComplete() {
    if (this.sources.length === 0) {
      this.complete()
    }
  }

  onStart() {
    this.pull()
  }
}

class FlatMapSink<I> extends SinkStage<I, void> {

  constructor (private readonly parent: FlatMapMerge<any, I>) {
    super()
  }

  onPush() {
    if (this.parent.isOutputAvailable()) {
      this.parent.push(this.grab())
      this.pullIfAllowed()
    } else {
      this.parent.queue.push(this)
    }
  }

  onComplete() {
    this.parent.sources.splice(this.parent.sources.indexOf(this), 1)

    if (this.parent.isInputClosed() && this.parent.sources.length === 0) {
      this.parent.complete()
    } else {
      this.parent.pullIfAllowed()
    }
  }

  onError(e: any): void {
    this.parent.error(e)
  }

  onStart() {
    this.pull()
  }
}
