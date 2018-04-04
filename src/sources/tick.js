import { Source, SourceStage } from '../core/source';
export function tick(interval, value) {
    return Source.fromStageFactory(() => new Tick(interval, value));
}
class Tick extends SourceStage {
    constructor(interval, value) {
        super();
        this.interval = interval;
        this.value = value;
    }
    onPull() {
    }
    onStart() {
        this.timerId = setInterval(() => {
            if (this.isOutputAvailable()) {
                this.push(this.value);
            }
        }, this.interval);
    }
    onCancel() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
    }
}
//# sourceMappingURL=tick.js.map