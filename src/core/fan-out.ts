import { Inlet, Outlet, Shape, SingleInputStage, UpstreamHandler } from './stage'
import { range } from 'lodash'

export abstract class FanOutShape<I> implements Shape {

  outputs: Outlet<any>[]
  inputs: Inlet<I>[]

  constructor(public input: Inlet<I>) {
    this.inputs = [input]
  }
}

export class UniformFanOutShape<I, O> implements FanOutShape<I> {

  inputs: Inlet<I>[]

  constructor(public input: Inlet<I>, public outputs: Outlet<O>[]) {
    this.inputs = [input]
  }
}

export abstract class FanOutStage<I, S extends FanOutShape<I>> extends SingleInputStage<I, S, void> {

  resultValue: void = undefined

  finish(): void {
    this.cancel()
    this.complete()
  }

  onError(e: any): void {
    this.error(e)
  }

  onComplete(): void {
    this.onStop()
    this.complete()
  }

  complete(): void {
    this.shape.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.complete();
      }
    });
  }

  error(e: any): void {
    this.shape.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.error(e);
      }
    });
  }
}

export abstract class UniformFanOutStage<I, O> extends FanOutStage<I, UniformFanOutShape<I, O>> {

  shape: UniformFanOutShape<I, O>

  constructor(protected outCount: number) {
    super()
    const outputs = range(0, outCount).map(i => new Outlet<O>(this.createUpstreamHandler(i)))
    this.shape = new UniformFanOutShape(new Inlet<I>(this), outputs)
  }

  protected output(i: number): Outlet<O> {
    return this.shape.outputs[i]
  }

  abstract createUpstreamHandler(index: number): UpstreamHandler
}
