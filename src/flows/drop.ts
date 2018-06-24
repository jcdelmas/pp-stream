import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function drop<A>(n: number): Flow<A, A> {
  return flow<A, A>(() => new Drop<A>(n));
}

declare module '../core/source' {
  interface Source<O> {
    drop(n: number): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    drop(n: number): Flow<I, O>
  }
}

_registerFlow('drop', drop);

class Drop<A> extends FlowStage<A, A> {

  private count = 0

  constructor(private readonly nbr: number) {
    super()
  }


  onPush(): void {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(this.grab());
    }
  }
}
