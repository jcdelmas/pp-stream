import { _registerSink, SinkStage, Sink } from '../core/sink';
export function forEach(cb) {
    return Sink.fromStageFactory(() => new ForEach(cb));
}
_registerSink('forEach', forEach);
class ForEach extends SinkStage {
    constructor(cb) {
        super();
        this.cb = cb;
    }
    onPush() {
        this.cb(this.grab());
        this.pull();
    }
    onStart() {
        this.pull();
    }
}
//# sourceMappingURL=for-each.js.map