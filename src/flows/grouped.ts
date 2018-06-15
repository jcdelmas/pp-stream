import { _registerFlow, Flow, FlowStage , createFlow } from '../core/flow'

export function grouped<A>(n: number): Flow<A, A[]> {
  return createFlow(() => new Grouped<A>(n));
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
