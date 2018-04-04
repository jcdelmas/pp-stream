import { Source, PushSourceStage } from '../core/source';
import { OverflowStrategy } from '../core/buffer';
export function fromCallback(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
    return Source.fromStageFactory(() => new CallbackSourceStage(callback, bufferSize, bufferOverflowStrategy));
}
class CallbackSourceStage extends PushSourceStage {
    constructor(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
        super({ bufferSize, bufferOverflowStrategy });
        this.callback = callback;
    }
    onStart() {
        this.callback(x => this.push(x), () => this.complete(), e => this.error(e));
    }
}
//# sourceMappingURL=from-callback.js.map