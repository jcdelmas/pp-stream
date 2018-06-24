import { _registerFlow, flow, Flow, FlowStage } from '../core/flow'

export function distinct<A>(): Flow<A, A> {
  return flow<A, A>(() => new Distinct<A>())
}

declare module '../core/source' {
  interface Source<O> {
    distinct(): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    distinct(): Flow<I, O>
  }
}

_registerFlow('distinct', distinct);

export class Distinct<A> extends FlowStage<A, A> {

  last?: A = null

  onPush(): void {
    const x = this.grab();
    if (x != this.last) {
      this.push(x);
      this.last = x;
    } else {
      this.pull();
    }
  }
}
