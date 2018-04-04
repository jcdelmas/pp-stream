import Buffer, { OverflowStrategy } from './buffer'
import { Inlet, Outlet, Shape, SingleOutputStage } from './stage'
import {
  materializerFromGraphFactory, Graph, GraphFactory, materializerFromStageFactory,
  StreamAttributes
} from './stream'
import Module from './module'
import { FlowShape } from './flow'
import { SinkShape, SinkStage } from './sink'
import { ClosedShape, RunnableGraph } from './runnable'
import { Sink } from './sink'

class SourceShape<O> implements Shape {

  inputs: Inlet<any>[] = []
  outputs: Outlet<any>[]

  constructor(public output: Outlet<O>) {
    this.outputs = [output]
  }
}

export abstract class SourceStage<O, M> extends SingleOutputStage<O, SourceShape<O>, M> {
  shape = new SourceShape(new Outlet<O>(this))
}

export class PushSourceStage<O, M> extends SourceStage<O, M> {

  buffer: Buffer<O>
  completePending: boolean = false

  constructor(props: { bufferSize?: number, bufferOverflowStrategy?: OverflowStrategy }) {
    super()
    this.buffer = new Buffer<O>(props.bufferSize, props.bufferOverflowStrategy)
  }

  push(x: O): void {
    if (this.isOutputAvailable()) {
      super.push(x);
    } else {
      this.buffer.push(x);
    }
  }

  onPull(): void {
    if (!this.buffer.isEmpty()) {
      super.push(this.buffer.pull());

      if (this.completePending && this.buffer.isEmpty()) {
        super.complete();
      }
    }
  }

  complete(): void {
    if (this.buffer.isEmpty()) {
      super.complete();
    } else {
      this.completePending = true;
    }
  }
}

export class Source<O, M> extends Graph<SourceShape<O>, M> {

  static create<O>(factory: GraphFactory<SourceShape<O>, M>): Source<O> {
    return new Source(materializerFromGraphFactory(factory))
  }

  static fromStageFactory<O>(factory: () => SourceStage<O, M>): Source<O> {
    return new Source(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<SourceShape<O>>) {
    super(materializer)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>>): Source<O2> {
    return Source.create(b => {
      const prev = b.add(this)
      const next = b.add(flow)
      prev.output.wire(next.input)
      return new SourceShape(next.output)
    })
  }

  to(sink: Graph<SinkShape<O>>): RunnableGraph {
    return RunnableGraph.create(b => {
      const prev = b.add(this)
      const next = b.add(sink)
      prev.output.wire(next.input)
      return ClosedShape.instance
    })
  }

  runWith(sink: Graph<SinkShape<O>>): any {
    return this.to(sink.key('_result')).run()._result;
  }

  runWithLastStage(sinkStage: SinkStage<O>): any {
    return this.runWith(Sink.fromStageFactory(() => sinkStage));
  }
}
