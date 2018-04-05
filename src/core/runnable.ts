import { Inlet, Outlet, Shape } from './stage'
import { Graph, StreamAttributes } from './stream'
import Module from './module'

export class ClosedShape implements Shape {
  static instance: ClosedShape = new ClosedShape

  readonly inputs: Inlet<any>[] = []
  readonly outputs: Outlet<any>[] = []
}

export class RunnableGraph<M> extends Graph<ClosedShape, M> {
  static fromGraph<M>(factory: Graph<ClosedShape, M>): RunnableGraph<M> {
    return new RunnableGraph<M>(factory.materializer, factory.attributes)
  }

  constructor(materializer: (attrs: StreamAttributes) => Module<ClosedShape, M>,
              attributes: StreamAttributes = {}) {
    super(materializer, attributes)
  }

  run(): M {
    const module = this.materialize()
    module.start()
    return module.materializedValue
  }
}