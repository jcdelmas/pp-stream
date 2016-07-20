import Buffer, { OverflowStrategy } from './buffer';
import { SourceStage } from './stage';

export class ArraySourceStage extends SourceStage {

  index = 0;

  constructor(items) {
    super();
    this.items = items;
  }

  onPull() {
    if (this.index < this.items.length) {
      this.push(this.items[this.index++]);
    }
    if (this.index == this.items.length) {
      this.complete();
    }
  }
}

export class PushSourceStage extends SourceStage {

  completePending = false;

  constructor(props) {
    super(props);
    this.buffer = new Buffer(props.bufferSize, props.bufferOverflowStrategy)
  }

  push(x) {
    if (this.isOutputAvailable()) {
      super.push(x);
    } else {
      this.buffer.push(x);
    }
  }

  onPull() {
    if (!this.buffer.isEmpty()) {
      super.push(this.buffer.pull());

      if (this.completePending && this.buffer.isEmpty()) {
        super.complete();
      }
    }
  }

  complete() {
    if (this.buffer.isEmpty()) {
      super.complete();
    } else {
      this.completePending = true;
    }
  }
}

export class CallbackSourceStage extends PushSourceStage {

  constructor(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
    super({ bufferSize, bufferOverflowStrategy });
    this.callback = callback;
  }

  doStart() {
    this.callback(
      x => this.push(x),
      () => this.complete(),
      e => this.error(e)
    );
  }
}