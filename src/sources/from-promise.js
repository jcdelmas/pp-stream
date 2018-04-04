import { Source, SourceStage } from '../core/source';
export function fromPromise(promise) {
    return Source.fromStageFactory(() => new PromiseSource(promise));
}
class PromiseSource extends SourceStage {
    constructor(promise) {
        super();
        this.promise = promise;
    }
    onPull() {
        this.promise.then(x => this.pushAndComplete(x), err => this.error(err));
    }
}
//# sourceMappingURL=from-promise.js.map