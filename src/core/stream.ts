import Module from './module'
import { Startable, Shape, Stage } from './stage'

export class GraphBuilder {
  submodules: Startable[] = []

  addModule<S extends Shape, M>(s: Graph<S, M>): Module<S, M> {
    const module = s.materialize()
    this.submodules.push(module)
    return module
  }

  _addAndMaterialize<S extends Shape, M>(s: Graph<S, M>): [S, M] {
    const module = this.addModule(s)
    return [module.shape, module.materializedValue]
  }

  add<S extends Shape>(s: Graph<S, any>): S {
    return this.addModule(s).shape
  }
}

export interface GraphFactory<S extends Shape> {
  (b: GraphBuilder): S
}

export type StreamAttributes = {}

export interface Materializer<S extends Shape, M> {
  (attrs: StreamAttributes): Module<S, M>
}

export function materializerFromStageFactory<S extends Shape, M>(stageFactory: () => Stage<S, M>): Materializer<S, M> {
  return (attrs: StreamAttributes) => {
    const stage = stageFactory();
    return new Module(
      stage.shape,
      [stage],
      attrs,
      stage.materializedValue
    )
  }
}

export class Graph<S extends Shape, M> {
  constructor(public materializer: Materializer<S, M>,
              public attributes: StreamAttributes = {}) {
  }

  private static createGraph<S extends Shape, M>(factory: (b: GraphBuilder) => [S, M]): Graph<S, M> {
    return new Graph((attrs: StreamAttributes) => {
      const builder = new GraphBuilder()
      const [shape, materializedValue] = factory(builder)
      return new Module(
        shape,
        builder.submodules,
        attrs,
        materializedValue
      )
    })
  }

  static create<S extends Shape>(factory: (b: GraphBuilder) => S): Graph<S, void> {
    return this.createGraph(b => [factory(b), undefined])
  }

  static createWithMat<S extends Shape, S1 extends Shape, M>(g1: Graph<S1, M>, factory: (b: GraphBuilder, s1: S1) => S): Graph<S, M> {
    return this.createGraph(builder => {
      const [s, materializedValue] = builder._addAndMaterialize(g1)
      return [factory(builder, s), materializedValue]
    })
  }

  static createWithMat2<
    S extends Shape,
    S1 extends Shape,
    S2 extends Shape,
    M1, M2, M>(
      g1: Graph<S1, M1>,
      g2: Graph<S2, M2>,
      f: (m1: M1, m2: M2) => M,
      factory: (b: GraphBuilder, s1: S1, s2: S2) => S
  ): Graph<S, M> {
    return this.createGraph(builder => {
      const [s1, m1] = builder._addAndMaterialize(g1)
      const [s2, m2] = builder._addAndMaterialize(g2)
      return [factory(builder, s1, s2), f(m1, m2)]
    })
  }

  materialize(): Module<S, M> {
    return this.materializer(this.attributes)
  }

  withAttributes(attrs: StreamAttributes): Graph<S, M> {
    return new Graph<S, M>(
      this.materializer,
      { ...this.attributes, ...attrs }
    )
  }
}
