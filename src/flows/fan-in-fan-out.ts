import { Flow, FlowShape, complexFlow } from '../core/flow'
import { Source } from '../core/source'
import { UniformFanInShape } from '../core/fan-in'
import { UniformFanOutShape } from '../core/fan-out'
import { Graph } from '../core/graph'

declare module 'core/source' {
  interface Source<O> {
    fanOutAndFanIn<A>(fanOutFactory: (size: number) => Graph<UniformFanOutShape<O, A>, any>): <B>(...flows: Flow<A, B>[]) => <O2>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O2>, any>) => Source<O2>
  }
}

declare module 'core/flow' {
  interface Flow<I, O> {
    fanOutAndFanIn<A>(fanOutFactory: (size: number) => Graph<UniformFanOutShape<O, A>, any>): <B>(...flows: Flow<A, B>[]) => <O2>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O2>, any>) => Flow<I, O2>
  }
}

Source.prototype.fanOutAndFanIn = function<O, A>(this: Source<O>, fanOutFactory: (size: number) => Graph<UniformFanOutShape<O, A>, any>) {
  return <B>(...flows: Flow<A, B>[]) => {
    return <O2>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O2>, any>) => {
      return this.pipe(fanOutAndFanIn(fanOutFactory)(...flows)(fanInFactory))
    }
  }
}

Flow.prototype.fanOutAndFanIn = function<I, O, A>(this: Flow<I, O>, fanOutFactory: (size: number) => Graph<UniformFanOutShape<O, A>, any>) {
  return <B>(...flows: Flow<A, B>[]) => {
    return <O2>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O2>, any>) => {
      return this.pipe(fanOutAndFanIn(fanOutFactory)(...flows)(fanInFactory))
    }
  }
}

export function fanOutAndFanIn<I, A>(fanOutFactory: (size: number) => Graph<UniformFanOutShape<I, A>, any>): <B>(...flows: Flow<A, B>[]) => <O>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O>, any>) => Flow<I, O> {
  return <B>(...flows: Flow<A, B>[]) => {
    return <O>(fanInFactory: (size: number) => Graph<UniformFanInShape<B, O>, any>) => {
      return complexFlow(b => {
        const bcast = b.add(fanOutFactory(flows.length))
        const merge = b.add(fanInFactory(flows.length))

        flows.forEach((flow, i) => {
          const f = b.add(flow)
          bcast.outputs[i].wire(f.input)
          f.output.wire(merge.inputs[i])
        })

        return new FlowShape(bcast.input, merge.output)
      })
    }
  }
}