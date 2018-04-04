import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function distinct() {
    return Flow.fromStageFactory(() => new Distinct());
}
_registerFlow('distinct', distinct);
export class Distinct extends FlowStage {
    constructor() {
        super(...arguments);
        this.last = null;
    }
    onPush() {
        const x = this.grab();
        if (x != this.last) {
            this.push(x);
            this.last = x;
        }
        else {
            this.pull();
        }
    }
}
//# sourceMappingURL=distinct.js.map