import GraphInstance from './graph-instance'
import { Shape, Startable } from './stage'

export class GraphBuilder {
  subInstances: Startable[] = []

  _instanciate<S extends Shape>(s: Graph<S, any>): GraphInstance<S, any> {
    const instance = s._instanciate()
    this.subInstances.push(instance)
    return instance
  }

  addAndGetResult<S extends Shape, R>(s: Graph<S, R>): [S, R] {
    const module = this._instanciate(s)
    return [module.shape, module.resultValue]
  }

  add<S extends Shape>(s: Graph<S, any>): S {
    return this._instanciate(s).shape
  }
}

export interface GraphInstanciator<S extends Shape, R> {
  (): GraphInstance<S, R>
}

export function complexGraphInstanciatorWithResult<S extends Shape, R>(factory: (b: GraphBuilder) => [S, R]): GraphInstanciator<S, R> {
  return () => {
    const builder = new GraphBuilder()
    const [shape, resultValue] = factory(builder)
    return {
      shape,
      resultValue,
      start() {
        builder.subInstances.forEach(s => s.start())
      }
    }
  }
}

export function complexGraphInstanciator<S extends Shape>(factory: (b: GraphBuilder) => S): GraphInstanciator<S, void> {
  return complexGraphInstanciatorWithResult(b => [factory(b), undefined])
}

export class Graph<S extends Shape, R> {
  constructor(public instanciator: GraphInstanciator<S, R>) {
  }

  _instanciate(): GraphInstance<S, R> {
    return this.instanciator()
  }
}
