import { _registerFlow, FlowStage, Flow } from '../core/flow';
export function filter(fn) {
    return Flow.fromStageFactory(() => new Filter(fn));
}
_registerFlow('filter', filter);
class Filter extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
    }
    onPush() {
        const x = this.grab();
        if (this.fn(x)) {
            this.push(x);
        }
        else {
            this.pull();
        }
    }
}
//# sourceMappingURL=filter.js.map