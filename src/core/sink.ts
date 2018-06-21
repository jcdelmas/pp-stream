import { Inlet, Outlet, Shape, SingleInputStage } from './stage'
import { upperFirst } from 'lodash'
import {
  Graph,
  GraphBuilder,
  Materializer,
  materializerFromGraphWithResult,
  materializerFromStageFactory
} from './graph'
import { Source } from './source'

export function createSink<I, R>(factory: () => SinkStage<I, R>): Sink<I, R> {
  return new Sink<I, R>(materializerFromStageFactory(factory))
}

export function createSinkFromGraph<I, R>(factory: (b: GraphBuilder) => [SinkShape<I>, Promise<R>]): Sink<I, R> {
  return new Sink(materializerFromGraphWithResult(factory))
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

  returnValue = new Promise<R>((resolve, reject) => {
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

  constructor(materializer: Materializer<SinkShape<I>, Promise<R>>) {
    super(materializer)
  }
}
