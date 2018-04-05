import { _registerSink, Sink, BasicSinkStage } from '../core/sink';
export function ignore() {
    return Sink.fromStageFactory(() => new Ignore());
}
_registerSink('ignore', ignore);
class Ignore extends BasicSinkStage {
    onNext() { }
}
//# sourceMappingURL=ignore.js.map