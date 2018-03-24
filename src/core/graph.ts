import Module from './module'
import { Startable, Shape, Stage } from './stage'

export class GraphBuilder {
  submodules: Startable[] = []

  _addModule<S extends Shape>(s: Graph<S, any>): Module<S, any> {
    const module = s.materialize()
    this.submodules.push(module)
    return module
  }

  addAndGetResult<S extends Shape, R>(s: Graph<S, R>): [S, R] {
    const module = this._addModule(s)
    return [module.shape, module.result]
  }

  add<S extends Shape>(s: Graph<S, any>): S {
    return this._addModule(s).shape
  }
}

export interface GraphFactory<S extends Shape> {
  (b: GraphBuilder): S
}

export type StreamAttributes = {}

export interface Materializer<S extends Shape, R> {
  (attrs: StreamAttributes): Module<S, R>
}

export function materializerFromStageFactory<S extends Shape, R>(stageFactory: () => Stage<S, R>): Materializer<S, R> {
  return (attrs: StreamAttributes) => {
    const stage = stageFactory();
    return new Module(
      stage.shape,
      [stage],
      attrs,
      stage.returnValue
    )
  }
}

export function materializerFromGraphWithResult<S extends Shape, R>(factory: (b: GraphBuilder) => [S, R]): Materializer<S, R> {
  return (attrs: StreamAttributes) => {
    const builder = new GraphBuilder()
    const [shape, result] = factory(builder)
    return new Module(
      shape,
      builder.submodules,
      attrs,
      result
    )
  }
}

export function materializerFromGraph<S extends Shape>(factory: (b: GraphBuilder) => S): Materializer<S, void> {
  return materializerFromGraphWithResult(b => [factory(b), undefined])
}

export class Graph<S extends Shape, R> {
  constructor(public materializer: Materializer<S, R>,
              public attributes: StreamAttributes = {}) {
  }

  static fromStageFactory<S extends Shape, R>(stageFactory: () => Stage<S, R>): Graph<S, R> {
    return new Graph(materializerFromStageFactory(stageFactory))
  }

  private static createGraph<S extends Shape, R>(factory: (b: GraphBuilder) => [S, R]): Graph<S, R> {
    return new Graph(materializerFromGraphWithResult(factory))
  }

  static create<S extends Shape>(factory: (b: GraphBuilder) => S): Graph<S, void> {
    return new Graph(materializerFromGraph(factory))
  }

  static createWithMat<S extends Shape, S1 extends Shape, M>(g1: Graph<S1, M>, factory: (b: GraphBuilder, s1: S1) => S): Graph<S, M> {
    return this.createGraph(builder => {
      const [s, materializedValue] = builder.addAndGetResult(g1)
      return [factory(builder, s), materializedValue]
    })
  }

  materialize(): Module<S, R> {
    return this.materializer(this.attributes)
  }

  withAttributes(attrs: StreamAttributes): Graph<S, R> {
    return new Graph<S, R>(
      this.materializer,
      { ...this.attributes, ...attrs }
    )
  }
}
