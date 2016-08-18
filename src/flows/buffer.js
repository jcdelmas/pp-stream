
import Buffer, { OverflowStrategy } from '../core/buffer';
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

export function buffer(size, overflowStrategy = OverflowStrategy.FAIL) {
  return create(() => new BufferFlow(size, overflowStrategy))
}

_registerFlow('buffer', buffer);

class BufferFlow extends Stage {

  pendingComplete = false;

  constructor(size, overflowStategy = OverflowStrategy.FAIL) {
    super();
    this.size = size;
    this.overflowStategy = overflowStategy;
    this.buffer = new Buffer(
      size,
      this.overflowStategy !== OverflowStrategy.BACK_PRESSURE
        ? this.overflowStategy
        : OverflowStrategy.FAIL
    );
  }

  doStart() {
    this.pull();
  }

  onPush() {
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

  onPull() {
    if (!this.buffer.isEmpty()) {
      this.push(this.buffer.pull());
    }
    this.pullIfAllowed();
    if (this.pendingComplete && this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onComplete() {
    if (this.buffer.isEmpty()) {
      this.complete();
    } else {
      this.pendingComplete = true;
    }
  }
}
