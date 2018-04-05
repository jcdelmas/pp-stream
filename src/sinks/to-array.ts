
import { _registerSink, Sink } from '../core/sink'
import { reduce } from './reduce';

export function toArray<I>(): Sink<I, Promise<I[]>> {
  return reduce<I, I[]>((xs, x) => [...xs, x], [])
}

_registerSink('toArray', toArray)
