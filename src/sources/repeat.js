import { Source, SourceStage } from '../core/source';
export function repeat(x) {
    return Source.fromStageFactory(() => new Repeat(x));
}
class Repeat extends SourceStage {
    constructor(x) {
        super();
        this.x = x;
    }
    onPull() {
        this.push(this.x);
    }
}
//# sourceMappingURL=repeat.js.map