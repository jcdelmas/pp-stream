import { _registerFlow, Flow, FlowStage, flow } from '../core/flow'

export function takeWhile<A>(fn: (x: A) => boolean): Flow<A, A> {
  return flow<A, A>(() => new TakeWhile(fn))
}

declare module '../core/source' {
  interface Source<O> {
    takeWhile(fn: (x: O) => boolean): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    takeWhile(fn: (x: O) => boolean): Flow<I, O>
  }
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
