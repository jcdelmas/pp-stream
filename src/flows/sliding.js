import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function sliding(n, step = 1) {
    return Flow.fromStageFactory(() => new Sliding(n, step));
}
_registerFlow('sliding', sliding);
class Sliding extends FlowStage {
    constructor(size, step = 1) {
        super();
        this.size = size;
        this.step = step;
        this.pendingData = false;
        this.buffer = [];
    }
    onPush() {
        this.buffer.push(this.grab());
        if (this.buffer.length === this.size) {
            const newBuffer = this.buffer.slice(this.step);
            this.push(this.buffer);
            this.buffer = newBuffer;
            this.pendingData = false;
        }
        else {
            this.pull();
            this.pendingData = true;
        }
    }
    onComplete() {
        if (this.pendingData) {
            this.push(this.buffer);
        }
        this.complete();
    }
}
//# sourceMappingURL=sliding.js.map