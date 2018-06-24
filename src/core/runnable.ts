import { Inlet, Outlet, Shape } from './stage'
import { Graph, GraphBuilder, GraphInstanciator, complexGraphInstanciatorWithResult } from './graph'

export function complexRunnableGraph<R>(factory: (b: GraphBuilder) => R): RunnableGraph<R> {
  return new RunnableGraph<R>(complexGraphInstanciatorWithResult((b) => [ClosedShape.instance, factory(b)]))
}

export class ClosedShape implements Shape {
  static instance: ClosedShape = new ClosedShape

  readonly inputs: Inlet<any>[] = []
  readonly outputs: Outlet<any>[] = []
}

export class RunnableGraph<R> extends Graph<ClosedShape, R> {

  constructor(instanciator: GraphInstanciator<ClosedShape, R>) {
    super(instanciator)
  }

  run(): R {
    const module = this._instanciate()
    module.start()
    return module.resultValue
  }
}