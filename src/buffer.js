
export const OverflowStrategy = {
  DROP_BUFFER: "DROP_BUFFER",
  DROP_HEAD: "DROP_HEAD",
  DROP_NEW: "DROP_NEW",
  DROP_TAIL: "DROP_TAIL",
  FAIL: "FAIL",
  BACK_PRESSURE: "BACK_PRESSURE"
};

export default class Buffer {

  buf = [];

  constructor(maxSize = 100, overflowStrategy = OverflowStrategy.DROP_NEW) {
    this.maxSize = maxSize;
    this.overflowStrategy = overflowStrategy;
  }

  size() {
    return this.buf.length;
  }

  isEmpty() {
    return this.buf.length === 0;
  }

  isFull() {
    return this.buf.length === this.maxSize;
  }

  push(x) {
    if (this.isFull()) {
      switch (this.overflowStrategy) {
        case Buffer.FAIL:
          throw new Error('Buffer overflow');
        case Buffer.DROP_BUFFER:
          this.buf = [];
          break;
        case Buffer.DROP_HEAD:
          this.buf.shift();
          break;
        case Buffer.DROP_NEW:
          return;
        case Buffer.DROP_TAIL:
          this.buf.pop();
          break;
        default:
          throw new Error('Not supported strategy')
      }
    }
    this.buf.push(x);
  }

  pull() {
    if (this.isEmpty()) {
      throw new Error('Empty buffer');
    }
    return this.buf.shift();
  }
}
