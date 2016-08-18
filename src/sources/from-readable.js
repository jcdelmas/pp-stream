
import Source, { create, SourceStage } from '../core/source';

export function fromPausedReadable(readable) {
  return create(() => new PausedReadableSource(readable));
}

Source.fromPausedReadable = fromPausedReadable;

class PausedReadableSource extends SourceStage {

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
