import MaterializedGraph from './materialized-graph'
import { Shape, Startable } from './stage'

export class GraphBuilder {
  subgraphs: Startable[] = []

  _addModule<S extends Shape>(s: Graph<S, any>): MaterializedGraph<S, any> {
    const module = s.materialize()
    this.subgraphs.push(module)
    return module
  }

  addAndGetResult<S extends Shape, R>(s: Graph<S, R>): [S, R] {
    const module = this._addModule(s)
    return [module.shape, module.resultValue]
  }

  add<S extends Shape>(s: Graph<S, any>): S {
    return this._addModule(s).shape
  }
}

export interface Materializer<S extends Shape, R> {
  (): MaterializedGraph<S, R>
}

export function materializerFromGraphWithResult<S extends Shape, R>(factory: (b: GraphBuilder) => [S, R]): Materializer<S, R> {
  return () => {
    const builder = new GraphBuilder()
    const [shape, resultValue] = factory(builder)
    return {
      shape,
      resultValue,
      start() {
        builder.subgraphs.forEach(s => s.start())
      }
    }
  }
}

export function materializerFromGraph<S extends Shape>(factory: (b: GraphBuilder) => S): Materializer<S, void> {
  return materializerFromGraphWithResult(b => [factory(b), undefined])
}

export class Graph<S extends Shape, R> {
  constructor(public materializer: Materializer<S, R>) {
  }

  static fromMaterializer<S extends Shape, R>(materializer: Materializer<S, R>): Graph<S, R> {
    return new Graph(materializer)
  }

  static create<S extends Shape>(factory: (b: GraphBuilder) => S): Graph<S, void> {
    return new Graph(materializerFromGraph(factory))
  }

  materialize(): MaterializedGraph<S, R> {
    return this.materializer()
  }
}
