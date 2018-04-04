import 'should';
import { Flow, delay, OverflowStrategy, FlowStage, fromCallback } from '../src';
export class TimedSource {
    constructor(sequence = []) {
        this.sequence = sequence;
    }
    static of(sequence) {
        return new TimedSource(sequence.map(([duration, value]) => ({ duration, value }))).toSource();
    }
    static then(duration, value) {
        return new TimedSource().then(duration, value);
    }
    then(duration, value) {
        this.sequence.push({ duration, value });
        return this;
    }
    toSource() {
        return fromCallback((push, done) => {
            const seq = new TimeSequence();
            this.sequence.forEach(({ duration, value }) => {
                seq.then(duration, () => push(value));
            });
            seq.run(done);
        });
    }
}
class WithTimeStage extends FlowStage {
    onStart() {
        this.startTime = new Date().getTime();
    }
    onPush() {
        if (!this.startTime) {
            throw new Error('Not ready!');
        }
        const x = this.grab();
        this.push([x, new Date().getTime() - this.startTime]);
    }
}
export function withTime() {
    return Flow.fromStageFactory(() => new WithTimeStage());
}
class TimeSequence {
    constructor() {
        this.events = [];
    }
    static then(duration, action) {
        return new TimeSequence().then(duration, action);
    }
    then(duration, action) {
        this.events.push({ duration, action });
        return this;
    }
    run(callback = () => { }) {
        this.events.reverse().reduce((acc, { action, duration }) => () => {
            setTimeout(() => {
                action();
                acc();
            }, duration);
        }, callback)();
    }
}
export function timeChecker(results, expected) {
    results.map(x => {
        const rawTime = x[1];
        return [x[0], Math.floor((rawTime + 50) / 100) * 100];
    }).should.be.eql(expected);
}
export function delayed(duration, result) {
    return new Promise(resolve => setTimeout(() => resolve(result), duration));
}
export function delayedFlow(duration) {
    return delay(duration, 1, OverflowStrategy.BACK_PRESSURE);
}
export function checkTime(time, expectedTime) {
    time.should.be.above(expectedTime - 30);
    time.should.be.below(expectedTime + 30);
}
//# sourceMappingURL=utils.js.map