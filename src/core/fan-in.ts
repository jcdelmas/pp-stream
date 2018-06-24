import { DownstreamHandler, Inlet, Outlet, Shape, SingleOutputStage } from './stage'
import { range } from 'lodash'
import { complexFlow, Flow, FlowShape } from './flow'
import { Graph } from './graph'
import { Source } from './source'

export abstract class FanInShape<O> implements Shape {

  outputs: Outlet<O>[]
  inputs: Inlet<any>[]

  constructor(public output: Outlet<O>) {
    this.outputs = [output]
  }
}

export class FanInShape2<I1, I2, O> implements Shape {

  outputs: Outlet<O>[]
  inputs: Inlet<any>[]

  constructor(public in1: Inlet<I1>, public in2: Inlet<I2>, public output: Outlet<O>) {
    this.inputs = [in1, in2]
    this.outputs = [output]
  }
}

export class FanInShape3<I1, I2, I3, O> implements Shape {

  outputs: Outlet<O>[]
  inputs: Inlet<any>[]

  constructor(public in1: Inlet<I1>,
              public in2: Inlet<I2>,
              public in3: Inlet<I3>,
              public output: Outlet<O>) {
    this.inputs = [in1, in2, in3]
    this.outputs = [output]
  }
}

export class UniformFanInShape<I, O> implements FanInShape<O> {

  outputs: Outlet<any>[]

  constructor(public inputs: Inlet<I>[], public output: Outlet<O>) {
    this.outputs = [output]
  }
}

export function fanInFlow<A>(source: Source<A>, graphFactory: (size: number) => Graph<UniformFanInShape<A, A>, void>): Flow<A, A> {
  return complexFlow(b => {
    const s = b.add(source)
    const merge = b.add(graphFactory(2))
    s.output.wire(merge.inputs[1])
    return new FlowShape(merge.inputs[0], merge.output)
  })
}

export abstract class FanInStage<O, S extends FanInShape<O>> extends SingleOutputStage<O, S> {

  finish(): void {
    this.cancel()
    this.complete()
  }

  onCancel(): void {
    this.cancel()
  }

  cancel(): void {
    this.shape.inputs.forEach(input => {
      if (!input.isClosed()) {
        input.cancel()
      }
    })
  }
}

export abstract class UniformFanInStage<I, O> extends FanInStage<O, UniformFanInShape<I, O>> {

  shape: UniformFanInShape<I, O>

  constructor(protected inCount: number) {
    super()
    const inputs = range(0, inCount).map(i => new Inlet<I>(this.createDownstreamHandler(i)))
    this.shape = new UniformFanInShape(inputs, new Outlet<O>(this))
  }

  protected input(i: number): Inlet<I> {
    return this.shape.inputs[i]
  }

  abstract createDownstreamHandler(index: number): DownstreamHandler
}
