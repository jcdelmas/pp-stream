import { Inlet, Outlet, Shape } from './stage'
import { Graph, GraphBuilder, materializerFromGraphWithResult, StreamAttributes } from './graph'
import Module from './module'

export function createRunnableFromGraph<R>(factory: (b: GraphBuilder) => R): RunnableGraph<R> {
  return new RunnableGraph<R>(materializerFromGraphWithResult((b) => [ClosedShape.instance, factory(b)]))
}

export class ClosedShape implements Shape {
  static instance: ClosedShape = new ClosedShape

  readonly inputs: Inlet<any>[] = []
  readonly outputs: Outlet<any>[] = []
}

export class RunnableGraph<R> extends Graph<ClosedShape, R> {
  static fromGraph<R>(factory: Graph<ClosedShape, R>): RunnableGraph<R> {
    return new RunnableGraph<R>(factory.materializer, factory.attributes)
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<ClosedShape, R>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }

  run(): R {
    const module = this.materialize()
    module.start()
    return module.result
  }
}