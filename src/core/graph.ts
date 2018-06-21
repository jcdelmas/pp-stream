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

export interface Materializer<S extends Shape, R> {
  (): Module<S, R>
}

export function materializerFromStageFactory<S extends Shape, R>(stageFactory: () => Stage<S, R>): Materializer<S, R> {
  return () => {
    const stage = stageFactory();
    return new Module(
      stage.shape,
      [stage],
      stage.returnValue
    )
  }
}

export function materializerFromGraphWithResult<S extends Shape, R>(factory: (b: GraphBuilder) => [S, R]): Materializer<S, R> {
  return () => {
    const builder = new GraphBuilder()
    const [shape, result] = factory(builder)
    return new Module(
      shape,
      builder.submodules,
      result
    )
  }
}

export function materializerFromGraph<S extends Shape>(factory: (b: GraphBuilder) => S): Materializer<S, void> {
  return materializerFromGraphWithResult(b => [factory(b), undefined])
}

export class Graph<S extends Shape, R> {
  constructor(public materializer: Materializer<S, R>) {
  }

  static fromStageFactory<S extends Shape, R>(stageFactory: () => Stage<S, R>): Graph<S, R> {
    return new Graph(materializerFromStageFactory(stageFactory))
  }

  static create<S extends Shape>(factory: (b: GraphBuilder) => S): Graph<S, void> {
    return new Graph(materializerFromGraph(factory))
  }

  materialize(): Module<S, R> {
    return this.materializer()
  }
}
