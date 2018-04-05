import { Inlet, Outlet, Shape, SingleInputStage } from './stage'
import { upperFirst } from 'lodash'
import {
  Graph,
  materializerFromStageFactory,
  StreamAttributes
} from './stream'
import Module from './module'
import { Source } from './source'

export class SinkShape<I> implements Shape {

  inputs: Inlet<any>[]
  outputs: Outlet<any>[] = []

  constructor(public input: Inlet<I>) {
    this.inputs = [input]
  }
}

export function _registerSink<I, M>(name: string, fn: (...args: any[]) => Sink<I, M>): void {
  Source.prototype['run' + upperFirst(name)] = function (...args: any[]) {
    return this.runWith(fn(...args))
  }
}

export abstract class SinkStage<I, M> extends SingleInputStage<I, SinkShape<I>, M> {

  shape = new SinkShape<I>(new Inlet<I>(this))

  complete(): void {
    this.cancel()
  }

  error(_: any): void {
    this.cancel()
  }
}

export abstract class SinkStageWithPromise<I, R> extends SinkStage<I, Promise<R>> {

  private resolve?: (result: R) => void
  private reject?: (error: any) => void

  protected result: R

  materializedValue = new Promise<R>((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })

  complete(): void {
    super.complete()
    if (this.resolve) {
      this.resolve(this.result)
    }
  }

  error(e: any): void {
    super.error(e)
    if (this.reject) {
      this.reject(e)
    }
  }
}

export abstract class BasicSinkStage<I, R> extends SinkStageWithPromise<I, R> {

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    this.onNext(this.grab());
    this.pull();
  }

  abstract onNext(x: I): void
}

export class Sink<I, M> extends Graph<SinkShape<I>, M> {

  static fromGraph<I, M>(factory: Graph<SinkShape<I>, M>): Sink<I, M> {
    return new Sink<I, M>(factory.materializer, factory.attributes)
  }

  static fromStageFactory<I, M>(factory: () => SinkStage<I, M>): Sink<I, M> {
    return new Sink<I, M>(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<SinkShape<I>, M>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }
}
