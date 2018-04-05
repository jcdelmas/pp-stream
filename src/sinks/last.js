import { _registerSink, Sink, BasicSinkStage } from '../core/sink';
export function last() {
    return Sink.fromStageFactory(() => new Last());
}
_registerSink('last', last);
class Last extends BasicSinkStage {
    onNext() {
        this.result = this.grab();
    }
}
//# sourceMappingURL=last.js.map