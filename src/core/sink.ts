import { Inlet, Outlet, Shape, SingleInputStage } from './stage'
import { upperFirst } from 'lodash'
import { Graph, GraphBuilder, GraphInstanciator, complexGraphInstanciatorWithResult } from './graph'
import { Source, SourceShape } from './source'

export function sink<I, R>(factory: GraphInstanciator<SinkShape<I>, Promise<R>>): Sink<I, R> {
  return new Sink<I, R>(factory)
}

export function complexSink<I, R>(factory: (b: GraphBuilder) => [SinkShape<I>, Promise<R>]): Sink<I, R> {
  return new Sink(complexGraphInstanciatorWithResult(factory))
}

export function simpleSink<I>(factory: (input: Inlet<I>) => { onPush: () => void, onStart?: () => void }): Sink<I, void> {
  return new Sink<I, void>(() => {
    const input = new Inlet<I>()
    const { onPush, onStart = () => {} } = factory(input)
    return {
      start: onStart,
      shape: new SinkShape(input),
      resultValue: new Promise((resolve, reject) => {
        input._setDownstreamHandler({ onPush, onComplete: () => resolve(), onError: (e: any) => reject(e) })
      })
    }
  })
}

export class SinkShape<I> implements Shape {

  inputs: Inlet<any>[]
  outputs: Outlet<any>[] = []

  constructor(public input: Inlet<I>) {
    this.inputs = [input]
  }
}

export function _registerSink<I, R>(name: string, fn: (...args: any[]) => Sink<I, R>): void {
  // @ts-ignore: no index signature error
  Source.prototype['run' + upperFirst(name)] = function (...args: any[]) {
    return this.runWith(fn(...args))
  }
}

export abstract class SinkStage<I, R> extends SingleInputStage<I, SinkShape<I>, Promise<R>> {

  shape = new SinkShape<I>(new Inlet<I>(this))

  result: R

  private resolve?: (result: R) => void
  private reject?: (error: any) => void

  resultValue = new Promise<R>((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })

  onError(e: any): void {
    if (this.reject) {
      this.reject(e)
    }
  }

  onComplete(): void {
    this.complete()
  }

  complete(): void {
    if (this.resolve) {
      this.resolve(this.result)
    }
  }
}

export abstract class BasicSinkStage<I, R> extends SinkStage<I, R> {

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    this.onNext(this.grab());
    this.pull();
  }

  abstract onNext(x: I): void
}

export class Sink<I, R> extends Graph<SinkShape<I>, Promise<R>> {

  constructor(instanciator: GraphInstanciator<SinkShape<I>, Promise<R>>) {
    super(instanciator)
  }
}
