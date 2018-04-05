import Buffer, { OverflowStrategy } from './buffer'
import { Inlet, Outlet, Shape, SingleOutputStage } from './stage'
import {
  Graph, 
  materializerFromStageFactory,
  StreamAttributes
} from './stream'
import Module from './module'
import { FlowShape } from './flow'
import { SinkShape, SinkStage } from './sink'
import { ClosedShape, RunnableGraph } from './runnable'
import { Sink } from './sink'
import { keepLeft, keepRight } from './keep'

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

  static fromGraph<O, M>(factory: Graph<SourceShape<O>, M>): Source<O, M> {
    return new Source<O, M>(factory.materializer, factory.attributes)
  }

  static fromStageFactory<O, M>(factory: () => SourceStage<O, M>): Source<O, M> {
    return new Source(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<SourceShape<O>, M>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>, M>): Source<O2, M> {
    return this.pipeMat(flow, keepLeft)
  }

  pipeMat<O2, M2, M3>(flow: Graph<FlowShape<O, O2>, M2>, combine: (m1: M, m2: M2) => M3): Source<O2, M3> {
    return Source.fromGraph(Graph.createWithMat2(this, flow, combine,(_, prev, next) => {
      prev.output.wire(next.input)
      return new SourceShape(next.output)
    }))
  }

  to(sink: Graph<SinkShape<O>, M>): RunnableGraph<M> {
    return this.toMat(sink, keepLeft)
  }

  toMat<M2, M3>(sink: Graph<SinkShape<O>, M2>, combine: (m1: M, m2: M2) => M3): RunnableGraph<M3> {
    return RunnableGraph.fromGraph(Graph.createWithMat2(this, sink, combine, (_, prev, next) => {
      prev.output.wire(next.input)
      return ClosedShape.instance
    }))
  }

  runWith<M2>(sink: Graph<SinkShape<O>, M2>): M2 {
    return this.toMat(sink, keepRight).run()
  }

  runWithLastStage<M2>(sinkStage: SinkStage<O, M2>): M2 {
    return this.runWith(Sink.fromStageFactory(() => sinkStage))
  }
}
