
import 'should';
import {
  Source,
  Flow
} from '../src/index';

export class TimedSource {

  sequence = [];

  static of(sequence) {
    return new TimedSource(sequence.map(([duration, value]) => ({ duration, value }))).toSource();
  }

  /**
   * @param {int} duration
   * @param value
   * @return {TimedSource}
   */
  static then(duration, value) {
    return new TimedSource().then(duration, value)
  }

  constructor(sequence = []) {
    this.sequence = sequence;
  }

  /**
   * @param {int} duration
   * @param value
   * @return {TimedSource}
   */
  then(duration, value) {
    this.sequence.push({ duration, value });
    return this;
  }

  /**
   * @return {Stream}
   */
  toSource() {
    return Source.fromCallback((push, done) => {
      const seq = new TimeSequence();
      this.sequence.forEach(({ duration, value }) => {
        seq.then(duration, () => push(value));
      });
      seq.run(done);
    })
  }
}

export const WithTime = Flow.createSimple({
  onStart() {
    this.startTime = new Date().getTime();
  },
  onPush() {
    const x = this.grab();
    this.push([x, new Date().getTime() - this.startTime])
  }
});

class TimeSequence {

  events = [];

  static then(duration, action) {
    return new TimeSequence().then(duration, action);
  }

  then(duration, action) {
    this.events.push({ duration, action });
    return this;
  }

  run(callback = () => {
  }) {
    this.events.reverse().reduce((acc, event) => () => {
      setTimeout(() => {
        event.action();
        acc();
      }, event.duration)
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
  return Flow.mapAsync(x => delayed(duration, x));
}

export function checkTime(time, expectedTime) {
  time.should.be.above(expectedTime - 30);
  time.should.be.below(expectedTime + 30);
}

