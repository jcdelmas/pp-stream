import { Graph } from '../core/graph'
import { Sink, SinkShape } from '../core/sink'
import { UniformFanOutShape } from '../core/fan-out'
import { complexGraphInstanciatorWithResult } from '../core/graph'

type FanOutFactory<I, O> = (size: number) => Graph<UniformFanOutShape<I, O>, void>

export function combineSinks<I, O>(...sinks: Sink<O, any>[]): (f: FanOutFactory<I, O>) => Sink<I, void> {
  return (f: FanOutFactory<I, O>) => new Sink(complexGraphInstanciatorWithResult(b => {
    const fanOut = b.add(f(sinks.length))
    const results = sinks.map((s, i) => {
      const [sink, resultPromise] = b.addAndGetResult(s)
      fanOut.outputs[i].wire(sink.input)
      return resultPromise
    })
    return [new SinkShape(fanOut.input), Promise.all(results).then(() => {})]
  }))
}