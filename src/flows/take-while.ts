import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function takeWhile<A>(fn: (x: A) => boolean): Flow<A, A> {
  return Flow.fromStageFactory<A, A>(() => new TakeWhile(fn))
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
      this.finish();
    }
  }
}
