import { _registerSink, Sink, SinkStageWithPromise } from '../core/sink';
export function forEach(cb) {
    return Sink.fromStageFactory(() => new ForEach(cb));
}
_registerSink('forEach', forEach);
class ForEach extends SinkStageWithPromise {
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