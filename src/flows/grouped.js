import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function grouped(n) {
    return Flow.fromStageFactory(() => new Grouped(n));
}
_registerFlow('grouped', grouped);
class Grouped extends FlowStage {
    constructor(size) {
        super();
        this.size = size;
        this.buffer = [];
    }
    onPush() {
        this.buffer.push(this.grab());
        if (this.buffer.length >= this.size) {
            this.push(this.buffer);
            this.buffer = [];
        }
        else {
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
//# sourceMappingURL=grouped.js.map