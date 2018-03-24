import { _registerFlow, createFlow, Flow, FlowStage } from '../core/flow'

export function take<A>(n: number): Flow<A, A> {
  return createFlow(() => new Take<A>(n))
}

declare module 'core/source' {
  interface Source<O> {
    take<A>(n: number): Source<O>
  }
}

declare module 'core/flow' {
  interface Flow<I, O> {
    take(n: number): Flow<I, O>
  }
}

_registerFlow('take', take);

export class Take<A> extends FlowStage<A, A> {

  private count: number = 0

  constructor(private readonly nbr: number) {
    super();
    this.nbr = nbr;
  }

  onPush(): void {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.cancel()
      this.complete()
    }
  }
}
