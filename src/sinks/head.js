import { _registerSink, Sink, SinkStage } from '../core/sink';
export function head() {
    return Sink.fromStageFactory(() => new Head());
}
_registerSink('head', head);
class Head extends SinkStage {
    onPush() {
        this.result = this.grab();
        this.complete();
    }
    onStart() {
        this.pull();
    }
}
//# sourceMappingURL=head.js.map