import { Source, SourceStage , source } from '../core/source'

export function fromPausedReadable(readable: NodeJS.ReadableStream): Source<string | Buffer> {
  return source(() => new PausedReadableSource(readable))
}

class PausedReadableSource extends SourceStage<string | Buffer> {

  constructor(private readable: NodeJS.ReadableStream) {
    super();
  }

  private _onReadable = () => {
    if (this.isOutputAvailable()) {
      this._consume();
    }
  };

  private _onEnd = () => {
    if (!this.isOutputClosed()) {
      this.complete();
    }
  };

  private _onError = (e: any) => {
    if (!this.isOutputClosed()) {
      this.error(e);
    }
  };

  onStart(): void {
    this.readable.on('readable', this._onReadable);
    this.readable.on('end', this._onEnd);
    this.readable.on('error', this._onError);
  }

  onPull(): void {
    this._consume();
  }

  private _consume(): void {
    const chunk = this.readable.read();
    if (chunk) this.push(chunk);
  }

  onCancel(): void {
    this.readable.removeListener('readable', this._onReadable);
    this.readable.removeListener('end', this._onEnd);
    this.readable.removeListener('error', this._onError);
  }
}
