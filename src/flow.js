import { SimpleStage } from './stage';
import Buffer, { OverflowStrategy } from './buffer';

export class BufferFlow extends SimpleStage {

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
    if (!this.isInputHasBeenPulled() && !this.isInputClosed()) {
      this.pull();
    }
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

export class Scan extends SimpleStage {
  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush() {
    this.acc = this.fn(this.acc, this.grab());
    this.push(this.acc);
  }
}

export class MapConcat extends SimpleStage {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  /**
   * @type {number}
   */
  index = 0;

  /**
   * @type {Array|null}
   */
  current = null;

  onPush() {
    this.current = this.fn(this.grab());
    this._pushNextOrPull();
  }

  onPull() {
    this._pushNextOrPull();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
    }
  }

  _pushNextOrPull() {
    if (this.current) {
      this.push(this.current[this.index++]);
      if (this.index >= this.current.length) {
        this.current = null;
        this.index = 0;
      }
    } else if (!this.inputs[0].isClosed()) {
      this.pull();
    } else {
      this.complete();
    }
  }
}

export class Grouped extends SimpleStage {
  constructor(size) {
    super();
    this.size = size;
  }

  /**
   * @type {Array}
   */
  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onComplete() {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

export class Sliding extends SimpleStage {
  constructor(size, step = 1) {
    super();
    this.size = size;
    this.step = step;
  }

  pendingData = false;

  buffer = [];

  onPush() {
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

  onComplete() {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

export class Take extends SimpleStage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.completeStage();
    }
  }
}

export class TakeWhile extends SimpleStage {

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
    const v = this.grab();
    if (this.fn(v)) {
      this.push(v);
    } else {
      this.completeStage();
    }
  }
}

export class Drop extends SimpleStage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(this.grab());
    }
  }
}

export class DropWhile extends SimpleStage {

  dropFinished = false;

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
    if (this.dropFinished) {
      this.push(this.grab());
    } else {
      const v = this.grab();
      if (this.fn(v)) {
        this.pull();
      } else {
        this.push(v);
        this.dropFinished = true;
      }
    }
  }
}

export class Delay extends SimpleStage {

  constructor(duration) {
    super();
    this.duration = duration;
  }

  currentTimeout = null;
  pendingComplete = false;

  onPush() {
    this.currentTimeout = setTimeout(() => {
      this.push(this.grab());
      if (this.pendingComplete) {
        this.complete();
      }
      this.currentTimeout = null;
    }, this.duration);
  }

  onComplete() {
    if (!this.currentTimeout) {
      this.complete();
    } else {
      this.pendingComplete = true;
    }
  }

  onCancel() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.cancel();
  }
}

export class Distinct extends SimpleStage {

  last = null;

  onPush() {
    const x = this.grab();
    if (x != this.last) {
      this.push(x);
      this.last = x;
    } else {
      this.pull();
    }
  }
}
