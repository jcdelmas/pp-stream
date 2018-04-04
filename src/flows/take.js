import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function take(n) {
    return Flow.fromStageFactory(() => new Take(n));
}
_registerFlow('take', take);
export class Take extends FlowStage {
    constructor(nbr) {
        super();
        this.nbr = nbr;
        this.count = 0;
        this.nbr = nbr;
    }
    onPush() {
        if (this.count++ < this.nbr) {
            this.push(this.grab());
        }
        if (this.count === this.nbr) {
            this.finish();
        }
    }
}
//# sourceMappingURL=take.js.map