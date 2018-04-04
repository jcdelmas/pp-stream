import { _registerSink, BasicSinkStage, Sink } from '../core/sink';
export function reduce(fn, zero) {
    return Sink.fromStageFactory(() => new Reduce(fn, zero));
}
_registerSink('reduce', reduce);
class Reduce extends BasicSinkStage {
    constructor(fn, zero) {
        super();
        this.fn = fn;
        this.result = zero;
    }
    onNext(x) {
        this.result = this.fn(this.result, x);
    }
    onComplete() {
        this.complete();
    }
}
//# sourceMappingURL=reduce.js.map