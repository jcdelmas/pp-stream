import { _registerFlow } from 'core/flow'
import { Source } from 'core/source'
import { flatMapMerge } from './flat-map-merge'

export function flatMapConcat<I, O>(fn: (x: I) => Source<O>) {
  return flatMapMerge(fn, 1)
}

declare module '../core/source' {
  interface Source<O> {
    flatMapConcat<O2>(fn: (x: O) => Source<O2>): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    flatMapConcat<O2>(fn: (x: O) => Source<O2>): Flow<I, O2>
  }
}

_registerFlow('flatMapConcat', flatMapConcat)
