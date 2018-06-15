import { _registerFlow, Flow, FlowStage, createFlow } from '../core/flow'

export function takeWhile<A>(fn: (x: A) => boolean): Flow<A, A> {
  return createFlow<A, A>(() => new TakeWhile(fn))
}

_registerFlow('takeWhile', takeWhile)

export class TakeWhile<A> extends FlowStage<A, A> {

  constructor(private readonly fn: (x: A) => boolean) {
    super()
  }

  onPush(): void {
    const v = this.grab();
    if (this.fn(v)) {
      this.push(v);
    } else {
      this.cancel()
      this.complete()
    }
  }
}
