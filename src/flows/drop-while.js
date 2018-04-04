import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function dropWhile(fn) {
    return Flow.fromStageFactory(() => new DropWhile(fn));
}
_registerFlow('dropWhile', dropWhile);
class DropWhile extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
        this.dropFinished = false;
    }
    onPush() {
        if (this.dropFinished) {
            this.push(this.grab());
        }
        else {
            const v = this.grab();
            if (this.fn(v)) {
                this.pull();
            }
            else {
                this.push(v);
                this.dropFinished = true;
            }
        }
    }
}
//# sourceMappingURL=drop-while.js.map