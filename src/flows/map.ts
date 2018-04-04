
import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function map<I, O>(fn: (x: I) => O): Flow<I, O> {
  return Flow.fromStageFactory(() => new Map(fn))
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
