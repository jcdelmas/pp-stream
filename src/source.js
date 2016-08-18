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

export class PausedReadableSource extends SourceStage {

  constructor(readable) {
    super();
    this.readable = readable;
  }

  _onReadable = () => {
    if (this.isOutputAvailable()) {
      this._consume();
    }
  };

  _onEnd = () => {
    if (!this.isOutputClosed()) {
      this.complete();
    }
  };

  _onError = e => {
    if (!this.isOutputClosed()) {
      this.error(e);
    }
  };

  doStart() {
    this.readable.on('readable', this._onReadable);
    this.readable.on('end', this._onEnd);
    this.readable.on('error', this._onError);
  }

  onPull() {
    this._consume();
  }

  _consume() {
    const chunk = this.readable.read();
    if (chunk) this.push(chunk);
  }

  onCancel() {
    this.readable.removeListener('readable', this._onReadable);
    this.readable.removeListener('end', this._onEnd);
    this.readable.removeListener('error', this._onError);
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