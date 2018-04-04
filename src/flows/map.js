import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function map(fn) {
    return Flow.fromStageFactory(() => new Map(fn));
}
_registerFlow('map', map);
class Map extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
    }
    onPush() {
        this.push(this.fn(this.grab()));
    }
}
//# sourceMappingURL=map.js.map