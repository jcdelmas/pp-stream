import { Inlet, Outlet, Shape } from './stage'
import { Graph, GraphFactory, materializerFromGraphFactory, StreamAttributes } from './stream'
import Module from './module'

export class ClosedShape implements Shape {
  static instance: ClosedShape = new ClosedShape

  readonly inputs: Inlet<any>[] = []
  readonly outputs: Outlet<any>[] = []
}

export class RunnableGraph<M> extends Graph<ClosedShape, M> {
  static create(factory: GraphFactory<ClosedShape, M>): RunnableGraph {
    return new RunnableGraph(materializerFromGraphFactory(factory))
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<ClosedShape>) {
    super(materializer)
  }

  run(): M {
    const module = this.materialize()
    module.start()
    return module.materializedValue
  }
}