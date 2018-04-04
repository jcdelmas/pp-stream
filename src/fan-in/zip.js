import { createFanIn, default as FanIn, FanInStage } from '../core/fan-in';
import Stream from '../core/stream';
export function zipSources(...sources) {
    return Stream.groupStreams(sources).zipStreams();
}
export function zip(size) {
    return createFanIn(size, size => new Zip(size));
}
Stream.prototype.zip = function (source) {
    return fanInStreams([this, source]);
};
Stream.prototype.zipStreams = function () {
    return this.fanIn(FanIn.zip);
};
export class Zip extends FanInStage {
    createDownstreamHandler(index) {
        return {
            onPush: () => {
                if (this.inputs.every(i => i.isAvailable())) {
                    this.push(this.inputs.map(i => i.grab()));
                    if (this.inputs.some(i => i.isClosed())) {
                        this.finish();
                    }
                }
            },
            onComplete: () => {
                if (!this.isOutputClosed() && !this.inputs[index].isAvailable()) {
                    this.finish();
                }
            },
            onError: e => this.error(e)
        };
    }
    onPull() {
        this.inputs.forEach(i => i.pull());
    }
    onCancel() {
        this.cancelAll();
    }
}
//# sourceMappingURL=zip.js.map