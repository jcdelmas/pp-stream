import Buffer, { OverflowStrategy } from '../core/buffer'
import { _registerFlow, Flow, FlowStage, flow } from '../core/flow'

export function buffer<A>(size: number, overflowStrategy: OverflowStrategy = OverflowStrategy.FAIL): Flow<A, A> {
  return flow(() => new BufferFlow(size, overflowStrategy))
}

declare module 'core/source' {
  interface Source<O> {
    buffer(size: number, overflowStrategy: OverflowStrategy): Source<O>
  }
}

declare module 'core/flow' {
  interface Flow<I, O> {
    buffer(size: number, overflowStrategy: OverflowStrategy): Flow<I, O>
  }
}

_registerFlow('buffer', buffer)

class BufferFlow<A> extends FlowStage<A, A> {

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
