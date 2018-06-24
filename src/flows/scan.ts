import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function scan<I, O>(fn: (acc: O, x: I) => O, zero: O): Flow<I, O> {
  return flow<I, O>(() => new Scan(fn, zero))
}

declare module '../core/source' {
  interface Source<O> {
    scan<O2>(fn: (acc: O2, x: O) => O2, zero: O2): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    scan<O2>(fn: (acc: O2, x: O) => O2, zero: O2): Flow<I, O2>
  }
}

_registerFlow('scan', scan)

class Scan<I, O> extends FlowStage<I, O> {

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