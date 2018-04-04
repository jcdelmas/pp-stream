import { createFanIn, FanInStage } from '../core/fan-in';
import Stream from '../core/stream';
export function interleaveFanIn(size, segmentSize = 1) {
    return createFanIn(size, () => new Interleave(size, segmentSize));
}
Stream.prototype.interleave = function (source, segmentSize = 1) {
    return Stream.groupStreams([this, source]).fanIn(size => interleaveFanIn(size, segmentSize));
};
Stream.prototype.interleaveStreams = function (segmentSize = 1) {
    return this.fanIn(size => interleaveFanIn(size, segmentSize));
};
export function interleaveSources(sources, segmentSize = 1) {
    return Stream.groupStreams(sources).interleaveStreams(segmentSize);
}
class Interleave extends FanInStage {
    constructor(size, segmentSize) {
        super(size);
        this.segmentSize = segmentSize;
        this.completedInputs = 0;
        this.currentInputIndex = 0;
        this.count = 0;
    }
    createDownstreamHandler(index) {
        return {
            onPush: () => {
                if (this.isOutputAvailable()) {
                    this.push(this.inputs[index].grab());
                    this.count++;
                    if (this.count === this.segmentSize) {
                        this._switchToNextInput();
                    }
                }
            },
            onComplete: () => {
                this.completedInputs++;
                if (this.completedInputs >= this.inputs.length) {
                    this.complete();
                }
                else if (this.currentInputIndex === index) {
                    this._switchToNextInput();
                    if (this.isOutputAvailable()) {
                        this.currentInput().pull();
                    }
                }
            },
            onError: e => this.error(e)
        };
    }
    _switchToNextInput() {
        this._incrementCurrentInput();
        while (this.currentInput().isClosed()) {
            this._incrementCurrentInput();
        }
        this.count = 0;
    }
    _incrementCurrentInput() {
        this.currentInputIndex = (this.currentInputIndex + 1) % this.inputs.length;
    }
    currentInput() {
        return this.inputs[this.currentInputIndex];
    }
    onPull() {
        this.currentInput().pullIfAllowed();
    }
    onCancel() {
        this.cancelAll();
    }
}
//# sourceMappingURL=interleave.js.map