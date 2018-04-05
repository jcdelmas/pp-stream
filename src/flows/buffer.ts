import Buffer, { OverflowStrategy } from '../core/buffer'
import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function buffer<A>(size: number, overflowStrategy: OverflowStrategy = OverflowStrategy.FAIL): Flow<A, A, void> {
  return Flow.fromStageFactory(() => new BufferFlow(size, overflowStrategy))
}

declare module '../core/source' {
  interface Source<O, M> {
    buffer(size: number, overflowStrategy: OverflowStrategy): Source<O, M>
  }
}

declare module '../core/flow' {
  interface Flow<I, O, M> {
    buffer(size: number, overflowStrategy: OverflowStrategy): Flow<I, O, M>
  }
}

_registerFlow('buffer', buffer)

class BufferFlow<A> extends FlowStage<A, A, void> {

  buffer: Buffer<A>
  pendingComplete: boolean = false;

  constructor(size: number, private readonly overflowStategy = OverflowStrategy.FAIL) {
    super()
    this.buffer = new Buffer<A>(
      size,
      this.overflowStategy !== OverflowStrategy.BACK_PRESSURE
        ? this.overflowStategy
        : OverflowStrategy.FAIL
    )
  }

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    const x = this.grab();
    if (this.buffer.isEmpty() && this.isOutputAvailable()) {
      this.push(x);
    } else {
      this.buffer.push(x);
    }
    if (this.overflowStategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
      this.pull();
    }
  }

  onPull(): void {
    if (!this.buffer.isEmpty()) {
      this.push(this.buffer.pull());
    }
    this.pullIfAllowed();
    if (this.pendingComplete && this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onComplete(): void {
    if (this.buffer.isEmpty()) {
      this.complete();
    } else {
      this.pendingComplete = true;
    }
  }
}
