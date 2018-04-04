import { _registerSink, Sink } from '../core/sink'
import { forEach } from './for-each'

export function ignore(): Sink<any> {
  return forEach<any>(() => {})
}

_registerSink('ignore', ignore)
