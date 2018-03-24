//
// import { Source, SourceStage , createSource } from '../core/source'
// import { createSink, Sink, SinkStage } from '../core/sink'
//
// export function mergeHub<O>(): Source<O, Sink<O, void>> {
//   return createSource(() => new MergeHubSource())
// }
//
// class MergeHubSource<O> extends SourceStage<O, Sink<O, void>> {
//
//   materializedValue: Sink<O, void>
//
//   sources: MergeHubSink<O>[] = []
//   queue: MergeHubSink<O>[] = []
//
//   constructor() {
//     super()
//     this.materializedValue = createSink(() => {
//       const sink = new MergeHubSink<O>(this)
//       this.sources.push(sink)
//       return sink
//     })
//   }
//
//   onPull() {
//     const source = this.queue.shift()
//     if (source) {
//       this.push(source.grab())
//       source.pullIfAllowed()
//     }
//   }
//
//   enqueue(source: MergeHubSink<O>) {
//     this.queue.push(source)
//   }
//
//   onCancel(): void {
//     this.sources.forEach(s => s.cancel())
//   }
//
//   onComplete(sink: MergeHubSink<O>) {
//     this.sources.splice(this.sources.indexOf(sink), 1)
//   }
//
//   onError(e: any) {
//     this.error(e)
//   }
// }
//
// class MergeHubSink<I> extends SinkStage<I, void> {
//
//   constructor(private sink: MergeHubSource<I>) {
//     super()
//   }
//
//   onStart(): void {
//     if (!this.sink.isOutputClosed()) {
//       this.pull()
//     } else {
//       this.cancel()
//     }
//   }
//
//   onComplete(): void {
//     this.sink.onComplete(this)
//   }
//
//   onError(e: any): void {
//     this.sink.onError(e)
//   }
//
//   onPush(): void {
//     if (this.sink.isOutputAvailable()) {
//       this.sink.push(this.grab())
//     } else {
//       this.sink.enqueue(this)
//     }
//   }
// }
