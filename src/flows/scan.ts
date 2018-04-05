import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function scan<I, O>(fn: (acc: O, x: I) => O, zero: O): Flow<I, O, void> {
  return Flow.fromStageFactory<I, O, void>(() => new Scan(fn, zero))
}

_registerFlow('scan', scan)

class Scan<I, O> extends FlowStage<I, O, void> {

  private acc: O

  constructor(private readonly fn: (acc: O, x: I) => O, zero: O) {
    super()
    this.acc = zero
  }

  onPush(): void {
    this.acc = this.fn(this.acc, this.grab())
    this.push(this.acc)
  }
}