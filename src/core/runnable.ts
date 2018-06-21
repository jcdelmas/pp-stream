import { Inlet, Outlet, Shape } from './stage'
import { Graph, GraphBuilder, Materializer, materializerFromGraphWithResult } from './graph'

export function createRunnableFromGraph<R>(factory: (b: GraphBuilder) => R): RunnableGraph<R> {
  return new RunnableGraph<R>(materializerFromGraphWithResult((b) => [ClosedShape.instance, factory(b)]))
}

export class ClosedShape implements Shape {
  static instance: ClosedShape = new ClosedShape

  readonly inputs: Inlet<any>[] = []
  readonly outputs: Outlet<any>[] = []
}

export class RunnableGraph<R> extends Graph<ClosedShape, R> {

  constructor(materializer: Materializer<ClosedShape, R>) {
    super(materializer)
  }

  run(): R {
    const module = this.materialize()
    module.start()
    return module.result
  }
}