import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function drop(n) {
    return Flow.fromStageFactory(() => new Drop(n));
}
_registerFlow('drop', drop);
class Drop extends FlowStage {
    constructor(nbr) {
        super();
        this.nbr = nbr;
        this.count = 0;
    }
    onPush() {
        if (this.count++ < this.nbr) {
            this.pull();
        }
        else {
            this.push(this.grab());
        }
    }
}
//# sourceMappingURL=drop.js.map