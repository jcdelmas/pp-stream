
export default class Buffer {
  static DROP_BUFFER = "DROP_BUFFER";
  static DROP_HEAD = "DROP_HEAD";
  static DROP_NEW = "DROP_NEW";
  static DROP_TAIL = "DROP_TAIL";
  static FAIL = "FAIL";

  buf = [];

  constructor(size = 100, overflowStrategy = Buffer.DROP_NEW) {
    this.size = size;
    this.overflowStrategy = overflowStrategy;
  }

  isEmpty() {
    return this.buf.length === 0;
  }

  isFull() {
    return this.buf.length === this.size;
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
