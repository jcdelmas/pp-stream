import { Source, SourceStage } from '../core/source';
export function single(x) {
    return Source.fromStageFactory(() => new Single(x));
}
class Single extends SourceStage {
    constructor(x) {
        super();
        this.x = x;
    }
    onPull() {
        this.pushAndComplete(this.x);
    }
}
//# sourceMappingURL=single.js.map