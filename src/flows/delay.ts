
import Buffer, { OverflowStrategy } from '../core/buffer'
import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function delay<A>(duration: number, bufferSize: number = 16, overflowStrategy: OverflowStrategy = OverflowStrategy.FAIL): Flow<A, A> {
  return flow<A, A>(() => new Delay<A>(duration, bufferSize, overflowStrategy))
}

export function debounce<A>(duration: number): Flow<A, A> {
  return flow<A, A>(() => new Delay<A>(duration, 1, OverflowStrategy.DROP_BUFFER))
}

declare module '../core/source' {
  interface Source<O> {
    delay(duration: number, bufferSize?: number, overflowStrategy?: OverflowStrategy): Source<O>
    debounce(duration: number): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    delay(duration: number, bufferSize?: number, overflowStrategy?: OverflowStrategy): Flow<I, O>
    debounce(duration: number): Flow<I, O>
  }
}

_registerFlow('delay', delay);
_registerFlow('debounce', debounce);


export class Delay<A> extends FlowStage<A, A> {

  buffer: Buffer<DelayedValue<A>>

  constructor(
    private readonly duration: number,
    bufferSize: number = 16,
    private readonly overflowStrategy: OverflowStrategy = OverflowStrategy.FAIL) {
    super()
    this.buffer = new Buffer<DelayedValue<A>>(bufferSize, overflowStrategy, v => v.cancel())
  }

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    this.buffer.push(new DelayedValue(this.grab(), this.duration, () => {
      if (this.isOutputAvailable()) {
        this.pushNext();
        if (this.overflowStrategy === OverflowStrategy.BACK_PRESSURE) {
          this.pullIfAllowed();
        }
      }
    }));
    if (this.overflowStrategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
      this.pullIfAllowed();
    }
  }

  onComplete(): void {
    if (this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onCancel(): void {
    this.buffer.drain().forEach(v => v.cancel());
    this.cancel();
  }

  onPull(): void {
    if (!this.buffer.isEmpty() && this.buffer.head().completed) {
      this.pushNext();
    }
  }

  pushNext(): void {
    this.push(this.buffer.pull().value);
    if (this.buffer.isEmpty() && this.isInputClosed()) {
      this.complete();
    }
  }
}

class DelayedValue<A> {

  completed = false;
  private readonly timeout: NodeJS.Timer

  constructor(
    public readonly value: A,
    duration: number,
    handler: () => void
  ) {
    this.timeout = setTimeout(() => {
      this.completed = true;
      handler();
    }, duration);
  }

  cancel() {
    clearTimeout(this.timeout)
  }
}
