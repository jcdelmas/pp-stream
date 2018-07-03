import Buffer, { OverflowStrategy } from './buffer'
import { Inlet, Outlet, Shape, SingleOutputStage, Startable, UpstreamHandler } from './stage'
import { Graph, GraphBuilder, GraphInstanciator, complexGraphInstanciator } from './graph'
import { FlowShape } from './flow'
import { SinkShape } from './sink'
import { complexRunnableGraph, RunnableGraph } from './runnable'

export function source<O>(factory: GraphInstanciator<SourceShape<O>, void>): Source<O> {
  return new Source(factory)
}

export function complexSource<O>(factory: (b: GraphBuilder) => Outlet<O>): Source<O> {
  return new Source(complexGraphInstanciator(b => new SourceShape(factory(b))))
}

export function simpleSource<O>(factory: (output: Outlet<O>) => { onPull: () => void, onCancel?: () => void, onStart?: () => void }): Source<O> {
  return new Source(() => {
    const output = new Outlet<O>()
    const { onPull, onCancel = () => {}, onStart = () => {} } = factory(output)
    output._setUpstreamHandler({ onPull, onCancel })
    return {
      start: onStart,
      shape: new SourceShape(output),
      resultValue: undefined
    }
  })
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

  constructor(instanciator: GraphInstanciator<SourceShape<O>, void>) {
    super(instanciator)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>, any>): Source<O2> {
    return complexSource(b => {
      const prev = b.add(this)
      const next = b.add(flow)
      prev.output.wire(next.input)
      return next.output
    })
  }

  to<R>(sink: Graph<SinkShape<O>, R>): RunnableGraph<R> {
    return complexRunnableGraph(b => {
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
