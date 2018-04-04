import { _registerFlow, Flow, FlowStage } from '../core/flow';
import { SinkStage } from '../core/sink';
export function flatMapConcat(fn) {
    return Flow.fromStageFactory(() => new FlatMapConcat(fn));
}
_registerFlow('flatMapConcat', flatMapConcat);
class FlatMapConcat extends FlowStage {
    constructor(fn) {
        super();
        this.fn = fn;
        this.completePending = false;
    }
    onPush() {
        const source = this.fn(this.grab());
        this.current = new FlatMapSink(this);
        source.runWithLastStage(this.current);
    }
    onPull() {
        if (this.current) {
            this.current.pullIfAllowed();
        }
        else {
            this.pull();
        }
    }
    onCancel() {
        if (this.current) {
            this.current.finish();
        }
        this.cancel();
    }
    onComplete() {
        if (!this.current) {
            this.complete();
        }
        else {
            this.completePending = true;
        }
    }
}
class FlatMapSink extends SinkStage {
    constructor(parent) {
        super();
        this.parent = parent;
    }
    onPush() {
        this.parent.push(this.grab());
    }
    onComplete() {
        this.parent.current = undefined;
        if (this.parent.completePending) {
            this.parent.complete();
        }
    }
    onStart() {
        this.pull();
    }
}
//# sourceMappingURL=flat-map-concat.js.map