import { Source, SourceStage } from '../core/source';
export function fromArray(items) {
    return Source.fromStageFactory(() => new ArraySourceStage(items));
}
class ArraySourceStage extends SourceStage {
    constructor(items) {
        super();
        this.items = items;
        this.index = 0;
    }
    onPull() {
        if (this.index < this.items.length) {
            this.push(this.items[this.index++]);
        }
        if (this.index == this.items.length) {
            this.complete();
        }
    }
}
//# sourceMappingURL=from-array.js.map