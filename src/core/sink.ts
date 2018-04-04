import { Inlet, Outlet, Shape, SingleInputStage } from './stage'
import { upperFirst } from 'lodash'
import {
  Graph, GraphFactory, materializerFromGraphFactory,
  materializerFromStageFactory, StreamAttributes
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

export function _registerSink<I>(name: string, fn: (...args: any[]) => Sink<I>): void {
  Source.prototype['run' + upperFirst(name)] = function (...args: any[]) {
    return this.runWith(fn(...args));
  };
}

export abstract class SinkStage<I> extends SingleInputStage<I, SinkShape<I>> {

  shape = new SinkShape<I>(new Inlet<I>(this))

  private resolve?: (result: any) => void
  private reject?: (error: any) => void

  protected result?: any = undefined

  constructor () {
    super()
    this.materializedValue = new Promise<I>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  complete(): void {
    this.cancel()
    if (this.resolve) {
      this.resolve(this.result)
    }
  }

  error(e: any): void {
    this.cancel()
    if (this.reject) {
      this.reject(e)
    }
  }
}

export abstract class BasicSinkStage<I> extends SinkStage<I> {

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    this.onNext(this.grab());
    this.pull();
  }

  abstract onNext(x: I): void
}

export class Sink<I> extends Graph<SinkShape<I>> {

  static create<I>(factory: GraphFactory<SinkShape<I>>): Sink<I> {
    return new Sink<I>(materializerFromGraphFactory(factory))
  }

  static fromStageFactory<I>(factory: () => SinkStage<I>): Sink<I> {
    return new Sink<I>(materializerFromStageFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<SinkShape<I>>) {
    super(materializer)
  }
}
