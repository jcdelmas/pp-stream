import {
  DownstreamHandler, Inlet, Outlet, Shape, SingleInputStage, SingleOutputStage, Stage,
  UpstreamHandler
} from './stage'
import {
  Graph, GraphFactory, materializerFromGraphFactory, materializerFromStageFactory,
  StreamAttributes
} from './stream'
import Module from './module'
import { applyMixins } from '../utils/mixins'
import { Sink, SinkShape } from './sink'
import { Source } from './source'

export class FlowShape<I, O> implements Shape {

  inputs: Inlet<any>[]
  outputs: Outlet<any>[]

  constructor(public input: Inlet<I>, public output: Outlet<O>) {
    this.inputs = [input]
    this.outputs = [output]
  }
}

export function _registerFlow<I, O>(name: string, fn: (...args: any[]) => Flow<I, O>): void {
  Source.prototype[name] = function(this: Source<I>, ...args: any[]): Source<O> {
    return this.pipe(fn(...args))
  }
  Flow.prototype[name] = function<I2>(this: Flow<I2, I>, ...args: any[]): Flow<I2, O> {
    return this.pipe(fn(...args))
  }
}

export abstract class FlowStage<I, O> extends Stage<FlowShape<I, O>>
  implements
    SingleInputStage<I, FlowShape<I, O>>,
    SingleOutputStage<O, FlowShape<I, O>>,
    DownstreamHandler, UpstreamHandler {

  shape = new FlowShape<I, O>(new Inlet<I>(this), new Outlet<O>(this))

  constructor() {
    super()
  }

  grab: () => I

  pull: () => void

  pullIfAllowed: () => void

  isInputAvailable: () => boolean

  isInputClosed: () => boolean

  isInputHasBeenPulled: () => boolean

  isInputCanBePulled: () => boolean

  push: (x: O) => void

  pushAndComplete: (x: O) => void

  isOutputAvailable: () => boolean

  isOutputClosed: () => boolean

  abstract onPush(): void

  onPull(): void {
    this.pullIfAllowed()
  }
}

applyMixins(FlowStage, [SingleInputStage, SingleOutputStage])

export class Flow<I, O> extends Graph<FlowShape<I, O>> {

  static create<I, O>(factory: GraphFactory<FlowShape<I, O>>): Flow<I, O> {
    return new Flow<I, O>(materializerFromGraphFactory(factory))
  }

  static fromStageFactory<I, O>(factory: () => FlowStage<I, O>): Flow<I, O> {
    return new Flow<I, O>(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<FlowShape<I, O>>) {
    super(materializer)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>>): Flow<I, O2> {
    return Flow.create(b => {
      const prev = b.add(this)
      const next = b.add(flow)
      prev.output.wire(next.input)
      return new FlowShape(prev.input, next.output)
    })
  }

  to(sink: Graph<SinkShape<O>>): Sink<I> {
    return Sink.create(b => {
      const prev = b.add(this)
      const next = b.add(sink)
      prev.output.wire(next.input)
      return new SinkShape(prev.input)
    })
  }
}