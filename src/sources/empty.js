import { Source, SourceStage } from '../core/source';
export const emptySource = Source.fromStageFactory(() => new Empty());
class Empty extends SourceStage {
    onPull() {
        this.complete();
    }
}
//# sourceMappingURL=empty.js.map