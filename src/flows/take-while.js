import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function takeWhile(fn) {
    return Flow.fromStageFactory(() => new TakeWhile(fn));
}
_registerFlow('takeWhile', takeWhile);
export class TakeWhile extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
    }
    onPush() {
        const v = this.grab();
        if (this.fn(v)) {
            this.push(v);
        }
        else {
            this.finish();
        }
    }
}
//# sourceMappingURL=take-while.js.map