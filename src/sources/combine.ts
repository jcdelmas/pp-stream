import { complexSource, Graph, Source } from '../'
import { UniformFanInShape } from '../core/fan-in'

type FanInFactory<I, O> = (size: number) => Graph<UniformFanInShape<I, O>, void>

export function combineSources<I, O>(...sources: Source<I>[]): (f: FanInFactory<I, O>) => Source<O> {
  return (f: FanInFactory<I, O>) => complexSource(b => {
    const fanIn = b.add(f(sources.length))
    sources.forEach((s, i) => b.add(s).output.wire(fanIn.inputs[i]))
    return fanIn.output
  })
}
