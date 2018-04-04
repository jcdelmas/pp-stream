
import { _registerSink, Sink } from '../core/sink'
import { reduce } from './reduce'

export function last<I>(): Sink<I> {
  return reduce((last, x) => x, undefined)
}

_registerSink('last', last);
