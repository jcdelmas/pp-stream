import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function grouped<A>(n: number): Flow<A, A[]> {
  return flow(() => new Grouped<A>(n));
}

declare module '../core/source' {
  interface Source<O> {
    grouped(n: number): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    grouped(n: number): Flow<I, O>
  }
}

_registerFlow('grouped', grouped)

class Grouped<A> extends FlowStage<A, A[]> {
  constructor(private readonly size: number) {
    super()
  }

  private buffer: A[] = [];

  onPush(): void {
    this.buffer.push(this.grab());
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onComplete(): void {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.complete();
  }
}
