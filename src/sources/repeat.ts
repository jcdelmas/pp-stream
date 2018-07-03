
import { Source, simpleSource } from '../core/source'

export function repeat<O>(x: O): Source<O> {
  return simpleSource<O>(output => ({ onPull: () => output.push(x) }))
}
