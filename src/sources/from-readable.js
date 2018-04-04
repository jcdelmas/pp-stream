import { Source, SourceStage } from '../core/source';
export function fromPausedReadable(readable) {
    return Source.fromStageFactory(() => new PausedReadableSource(readable));
}
class PausedReadableSource extends SourceStage {
    constructor(readable) {
        super();
        this.readable = readable;
        this._onReadable = () => {
            if (this.isOutputAvailable()) {
                this._consume();
            }
        };
        this._onEnd = () => {
            if (!this.isOutputClosed()) {
                this.complete();
            }
        };
        this._onError = (e) => {
            if (!this.isOutputClosed()) {
                this.error(e);
            }
        };
    }
    onStart() {
        this.readable.on('readable', this._onReadable);
        this.readable.on('end', this._onEnd);
        this.readable.on('error', this._onError);
    }
    onPull() {
        this._consume();
    }
    _consume() {
        const chunk = this.readable.read();
        if (chunk)
            this.push(chunk);
    }
    onCancel() {
        this.readable.removeListener('readable', this._onReadable);
        this.readable.removeListener('end', this._onEnd);
        this.readable.removeListener('error', this._onError);
    }
}
//# sourceMappingURL=from-readable.js.map