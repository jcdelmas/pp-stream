import Buffer, { OverflowStrategy } from './buffer'
import { Inlet, Outlet, Shape, SingleOutputStage } from './stage'
import { Graph, GraphBuilder, materializerFromGraph, materializerFromStageFactory, StreamAttributes } from './graph'
import Module from './module'
import { FlowShape } from './flow'
import { SinkShape } from './sink'
import { createRunnableFromGraph, RunnableGraph } from './runnable'

export function createSource<O>(factory: () => SourceStage<O>): Source<O> {
  return new Source(materializerFromStageFactory(factory))
}

export function createSourceFromGraph<O>(factory: (b: GraphBuilder) => SourceShape<O>): Source<O> {
  return new Source(materializerFromGraph(factory))
}

export class SourceShape<O> implements Shape {

  inputs: Inlet<any>[] = []
  outputs: Outlet<any>[]

  constructor(public output: Outlet<O>) {
    this.outputs = [output]
  }
}

export abstract class SourceStage<O> extends SingleOutputStage<O, SourceShape<O>> {
  shape = new SourceShape(new Outlet<O>(this))

  onCancel(): void {
  }
}

export class PushSourceStage<O> extends SourceStage<O> {

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

export class Source<O> extends Graph<SourceShape<O>, void> {

  constructor(materializer: (attrs: StreamAttributes) => Module<SourceShape<O>, void>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>, any>): Source<O2> {
    return createSourceFromGraph(b => {
      const prev = b.add(this)
      const next = b.add(flow)
      prev.output.wire(next.input)
      return new SourceShape(next.output)
    })
  }

  to<R>(sink: Graph<SinkShape<O>, R>): RunnableGraph<R> {
    return createRunnableFromGraph(b => {
      const prev = b.add(this)
      const [next, result] = b.addAndGetResult(sink)
      prev.output.wire(next.input)
      return result
    })
  }

  runWith<R>(sink: Graph<SinkShape<O>, R>): R {
    return this.to(sink).run()
  }
}
