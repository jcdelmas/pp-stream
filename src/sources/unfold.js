import { Source, SourceStage } from '../core/source';
export function unfold(fn, zero) {
    return Source.fromStageFactory(() => new Unfold(fn, zero));
}
class Unfold extends SourceStage {
    constructor(fn, zero) {
        super();
        this.fn = fn;
        this.state = zero;
    }
    onPull() {
        const result = this.fn(this.state);
        if (result) {
            const [newState, x] = result;
            this.push(x);
            this.state = newState;
        }
        else {
            this.complete();
        }
    }
}
//# sourceMappingURL=unfold.js.map