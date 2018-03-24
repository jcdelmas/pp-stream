import { Sink } from 'core/sink'
import { Source } from 'core/source'
import { reduce } from 'sinks/reduce'

export function toArray<I>(): Sink<I, I[]> {
  return reduce<I, I[]>((xs, x) => [...xs, x], [])
}

declare module 'core/source' {
  interface Source<O> {
    runToArray(): Promise<O[]>
  }
}

Source.prototype.runToArray = function<O>(this: Source<O>) {
  return this.runWith(toArray())
}
