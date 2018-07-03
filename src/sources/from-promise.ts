
import { Source, simpleSource } from '../core/source'

export function fromPromise<O>(promise: Promise<O>): Source<O> {
  return simpleSource<O>(output => ({
    onPull: () => promise.then(
      x => output.pushAndComplete(x),
      err => output.error(err)
    )
  }))
}
