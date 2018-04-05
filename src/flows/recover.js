import { _registerFlow, Flow, FlowStage } from '../core/flow';
import { isUndefined } from 'util';
export function recover(fn = () => undefined) {
    return Flow.fromStageFactory(() => new Recover(fn));
}
_registerFlow('recover', recover);
class Recover extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
    }
    onPush() {
        this.push(this.grab());
    }
    onError(e) {
        try {
            const result = this.fn(e);
            if (!isUndefined(result)) {
                this.push(result);
            }
            else {
                this.pull();
            }
        }
        catch (e) {
            this.error(e);
        }
    }
}
//# sourceMappingURL=recover.js.map