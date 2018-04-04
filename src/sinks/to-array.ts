
import { _registerSink, Sink } from '../core/sink'
import { reduce } from './reduce';

export function toArray<I>(): Sink<I> {
  return reduce((xs, x) => xs.concat([x]), [])
}

_registerSink('toArray', toArray)
