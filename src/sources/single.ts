import { simpleSource, Source } from '../core/source'

export function single<O>(x: O): Source<O> {
  return simpleSource<O>(output => ({ onPull: () => output.pushAndComplete(x) }))
}
