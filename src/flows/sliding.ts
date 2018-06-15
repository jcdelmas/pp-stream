import { _registerFlow, Flow, FlowStage , createFlow } from '../core/flow'

export function sliding<A>(n: number, step: number = 1): Flow<A, A[]> {
  return createFlow(() => new Sliding(n, step))
}

_registerFlow('sliding', sliding)

class Sliding<A> extends FlowStage<A, A[]> {
  constructor(
    private readonly size: number,
    private readonly step: number = 1
  ) {
    super()
  }

  private pendingData: boolean = false;

  private buffer: A[] = []

  onPush(): void {
    this.buffer.push(this.grab());
    if (this.buffer.length === this.size) {
      const newBuffer = this.buffer.slice(this.step);
      this.push(this.buffer);
      this.buffer = newBuffer;
      this.pendingData = false;
    } else {
      this.pull();
      this.pendingData = true;
    }
  }

  onComplete(): void {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.complete();
  }
}
