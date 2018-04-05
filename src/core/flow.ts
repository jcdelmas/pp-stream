import {
  DownstreamHandler,
  Inlet,
  Outlet,
  Shape,
  SingleInputStage,
  SingleOutputStage,
  Stage,
  UpstreamHandler
} from './stage'
import { Graph, materializerFromStageFactory, StreamAttributes } from './stream'
import Module from './module'
import { applyMixins } from '../utils/mixins'
import { Sink, SinkShape } from './sink'
import { Source } from './source'
import { keepLeft } from './keep'

export class FlowShape<I, O> implements Shape {

  inputs: Inlet<any>[]
  outputs: Outlet<any>[]

  constructor(public input: Inlet<I>, public output: Outlet<O>) {
    this.inputs = [input]
    this.outputs = [output]
  }
}

export function _registerFlow<I, O, M>(name: string, fn: (...args: any[]) => Flow<I, O, M>): void {
  Source.prototype[name] = function(this: Source<I, M>, ...args: any[]): Source<O, M> {
    return this.pipe(fn(...args))
  }
  Flow.prototype[name] = function<I2>(this: Flow<I2, I, M>, ...args: any[]): Flow<I2, O, M> {
    return this.pipe(fn(...args))
  }
}

export abstract class FlowStage<I, O, M> extends Stage<FlowShape<I, O>, M>
  implements
    SingleInputStage<I, FlowShape<I, O>, M>,
    SingleOutputStage<O, FlowShape<I, O>, M>,
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

export class Flow<I, O, M> extends Graph<FlowShape<I, O>, M> {

  static fromGraph<I, O, M>(factory: Graph<FlowShape<I, O>, M>): Flow<I, O, M> {
    return new Flow<I, O, M>(factory.materializer, factory.attributes)
  }

  static fromStageFactory<I, O, M>(factory: () => FlowStage<I, O, M>): Flow<I, O, M> {
    return new Flow<I, O, M>(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<FlowShape<I, O>, M>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }

  pipe<O2>(flow: Graph<FlowShape<O, O2>, M>): Flow<I, O2, M> {
    return this.pipeMat(flow, keepLeft)
  }

  pipeMat<O2, M2, M3>(flow: Graph<FlowShape<O, O2>, M2>, combine: (m1: M, m2: M2) => M3): Flow<I, O2, M3> {
    return Flow.fromGraph(Graph.createWithMat2(this, flow, combine,(_, prev, next) => {
      prev.output.wire(next.input)
      return new FlowShape(prev.input, next.output)
    }))
  }

  to<M>(sink: Graph<SinkShape<O>, M>): Sink<I, M> {
    return this.toMat(sink, keepLeft)
  }

  toMat<M2, M3>(sink: Graph<SinkShape<O>, M2>, combine: (m1: M, m2: M2) => M3): Sink<I, M3> {
    return Sink.fromGraph(Graph.createWithMat2(this, sink, combine, (_, prev, next) => {
      prev.output.wire(next.input)
      return new SinkShape(prev.input)
    }))
  }
}