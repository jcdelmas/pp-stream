import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function scan(fn, zero) {
    return Flow.fromStageFactory(() => new Scan(fn, zero));
}
_registerFlow('scan', scan);
class Scan extends FlowStage {
    constructor(fn, zero) {
        super();
        this.fn = fn;
        this.acc = zero;
    }
    onPush() {
        this.acc = this.fn(this.acc, this.grab());
        this.push(this.acc);
    }
}
//# sourceMappingURL=scan.js.map