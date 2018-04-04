import { Source, SourceStage } from '../core/source';
export function unfoldAsync(fn, zero) {
    return Source.fromStageFactory(() => new UnfoldAsync(fn, zero));
}
class UnfoldAsync extends SourceStage {
    constructor(fn, zero) {
        super();
        this.fn = fn;
        this.state = zero;
    }
    onPull() {
        this.fn(this.state).then(result => {
            if (result) {
                const [newState, x] = result;
                this.push(x);
                this.state = newState;
            }
            else {
                this.complete();
            }
        }).catch(e => this.error(e));
    }
}
//# sourceMappingURL=unfold-async.js.map