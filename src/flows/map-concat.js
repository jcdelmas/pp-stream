import { _registerFlow, Flow, FlowStage } from '../core/flow';
export function mapConcat(fn) {
    return Flow.fromStageFactory(() => new MapConcat(fn));
}
_registerFlow('mapConcat', mapConcat);
export class MapConcat extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
        this.index = 0;
    }
    onPush() {
        this.current = this.fn(this.grab());
        this._pushNextOrPull();
    }
    onPull() {
        this._pushNextOrPull();
    }
    onComplete() {
        if (!this.current) {
            this.complete();
        }
    }
    _pushNextOrPull() {
        if (this.current) {
            this.push(this.current[this.index++]);
            if (this.index >= this.current.length) {
                this.current = undefined;
                this.index = 0;
            }
        }
        else if (!this.shape.input.isClosed()) {
            this.pull();
        }
        else {
            this.complete();
        }
    }
}
//# sourceMappingURL=map-concat.js.map