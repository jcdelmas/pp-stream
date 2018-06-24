import { Inlet, Outlet, Shape, SingleInputStage, SingleOutputStage, Stage } from './stage'
import { Graph, GraphBuilder, GraphInstanciator, complexGraphInstanciator } from './graph'
import { applyMixins } from '../utils/mixins'
import { complexSink, Sink, SinkShape } from './sink'
import { Source } from './source'

export function flow<I, O>(instanciator: GraphInstanciator<FlowShape<I, O>, void>): Flow<I, O> {
  return new Flow(instanciator)
}

export function complexFlow<I, O>(factory: (b: GraphBuilder) => FlowShape<I, O>): Flow<I, O> {
  return new Flow(complexGraphInstanciator(factory))
}

export class FlowShape<I, O> implements Shape {

  inputs: Inlet<any>[]
  outputs: Outlet<any>[]

  constructor(public input: Inlet<I>, public output: Outlet<O>) {
    this.inputs = [input]
    this.outputs = [output]
  }
}

export function _registerFlow<I, O>(name: string, fn: (...args: any[]) => Flow<I, O>): void {
  // @ts-ignore: no index signature error
  Source.prototype[name] = function(this: Source<I>, ...args: any[]): Source<O> {
    return this.pipe(fn(...args))
  }
  // @ts-ignore: no index signature error
  Flow.prototype[name] = function<I2>(this: Flow<I2, I>, ...args: any[]): Flow<I2, O> {
    return this.pipe(fn(...args))
  }
}

export abstract class FlowStage<I, O> extends Stage<FlowShape<I, O>, void>
  implements
    SingleInputStage<I, FlowShape<I, O>, void>,
    SingleOutputStage<O, FlowShape<I, O>> {

  resultValue: void = undefined

  shape = new FlowShape<I, O>(new Inlet<I>(this), new Outlet<O>(this))

  abstract onPush(): void

  onError(e: any): void {
    this.error(e)
  }

  onComplete(): void {
    this.onStop()
    this.complete()
  }

  onPull(): void {
    this.pullIfAllowed()
  }

  onCancel(): void {
    this.onStop()
    this.cancel()
  }

  stop(): void {
    this.cancel()
    this.onStop()
    this.complete()
  }

  grab: () => I

  pull: () => void

  pullIfAllowed: () => void

  cancel: () => void

  push: (x: O) => void

  pushAndComplete: (x: O) => void

  complete: () => void

  error: (e: any) => void

  isInputAvailable: () => boolean

  isInputClosed: () => boolean

  isInputHasBeenPulled: () => boolean

  isInputCanBePulled: () => boolean

  isOutputAvailable: () => boolean

  isOutputClosed: () => boolean
}

applyMixins(FlowStage, [SingleInputStage, SingleOutputStage])

export class Flow<I, O> extends Graph<FlowShape<I, O>, void> {

  constructor(instanciator: GraphInstanciator<FlowShape<I, O>, void>) {
    super(instanciator)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>, any>): Flow<I, O2> {
    return complexFlow(b => {
      const prev = b.add(this)
      const next = b.add(flow)
      prev.output.wire(next.input)
      return new FlowShape(prev.input, next.output)
    })
  }

  to<R>(sink: Sink<O, R>): Sink<I, R> {
    return complexSink(b => {
      const prev = b.add(this)
      const [next, result] = b.addAndGetResult(sink)
      prev.output.wire(next.input)
      return [new SinkShape(prev.input), result]
    })
  }
}