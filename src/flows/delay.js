import Buffer, { OverflowStrategy } from '../core/buffer';
import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function delay(duration, bufferSize = 16, overflowStrategy = OverflowStrategy.FAIL) {
    return Flow.fromStageFactory(() => new Delay(duration, bufferSize, overflowStrategy));
}
export function debounce(duration) {
    return Flow.fromStageFactory(() => new Delay(duration, 1, OverflowStrategy.DROP_BUFFER));
}
_registerFlow('delay', delay);
_registerFlow('debounce', debounce);
export class Delay extends FlowStage {
    constructor(duration, bufferSize = 16, overflowStrategy = OverflowStrategy.FAIL) {
        super();
        this.duration = duration;
        this.overflowStrategy = overflowStrategy;
        this.buffer = new Buffer(bufferSize, overflowStrategy, v => v.cancel());
    }
    onStart() {
        this.pull();
    }
    onPush() {
        this.buffer.push(new DelayedValue(this.grab(), this.duration, () => {
            if (this.isOutputAvailable()) {
                this.pushNext();
                if (this.overflowStrategy === OverflowStrategy.BACK_PRESSURE) {
                    this.pullIfAllowed();
                }
            }
        }));
        if (this.overflowStrategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
            this.pullIfAllowed();
        }
    }
    onComplete() {
        if (this.buffer.isEmpty()) {
            this.complete();
        }
    }
    onCancel() {
        this.buffer.drain().forEach(v => v.cancel());
        this.cancel();
    }
    onPull() {
        if (!this.buffer.isEmpty() && this.buffer.head().completed) {
            this.pushNext();
        }
    }
    pushNext() {
        this.push(this.buffer.pull().value);
        if (this.buffer.isEmpty() && this.isInputClosed()) {
            this.complete();
        }
    }
}
class DelayedValue {
    constructor(value, duration, handler) {
        this.value = value;
        this.completed = false;
        this.timeout = setTimeout(() => {
            this.completed = true;
            handler();
        }, duration);
    }
    cancel() {
        clearTimeout(this.timeout);
    }
}
//# sourceMappingURL=delay.js.map