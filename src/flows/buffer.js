import Buffer, { OverflowStrategy } from '../core/buffer';
import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function buffer(size, overflowStrategy = OverflowStrategy.FAIL) {
    return Flow.fromStageFactory(() => new BufferFlow(size, overflowStrategy));
}
_registerFlow('buffer', buffer);
class BufferFlow extends FlowStage {
    constructor(size, overflowStategy = OverflowStrategy.FAIL) {
        super();
        this.overflowStategy = overflowStategy;
        this.pendingComplete = false;
        this.buffer = new Buffer(size, this.overflowStategy !== OverflowStrategy.BACK_PRESSURE
            ? this.overflowStategy
            : OverflowStrategy.FAIL);
    }
    onStart() {
        this.pull();
    }
    onPush() {
        const x = this.grab();
        if (this.buffer.isEmpty() && this.isOutputAvailable()) {
            this.push(x);
        }
        else {
            this.buffer.push(x);
        }
        if (this.overflowStategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
            this.pull();
        }
    }
    onPull() {
        if (!this.buffer.isEmpty()) {
            this.push(this.buffer.pull());
        }
        this.pullIfAllowed();
        if (this.pendingComplete && this.buffer.isEmpty()) {
            this.complete();
        }
    }
    onComplete() {
        if (this.buffer.isEmpty()) {
            this.complete();
        }
        else {
            this.pendingComplete = true;
        }
    }
}
//# sourceMappingURL=buffer.js.map