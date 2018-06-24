import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function map<I, O>(fn: (x: I) => O): Flow<I, O> {
  return flow(() => new Map(fn))
}

declare module '../core/source' {
  interface Source<O> {
    map<O2>(fn: (x: O) => O2): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    map<O2>(fn: (x: O) => O2): Flow<I, O2>
  }
}

_registerFlow('map', map)

class Map<I, O> extends FlowStage<I, O> {

  constructor (private readonly fn: (x: I) => O) {
    super()
  }

  onPush(): void {
    this.push(this.fn(this.grab()))
  }
}
