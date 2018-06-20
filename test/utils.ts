import 'should'
import {
  Flow,
  delay,
  OverflowStrategy,
  FlowStage,
  fromCallback, createFlow
} from '../src'

type TimeStep<A> = {
  duration: number,
  value: A
}

export class TimedSource<A> {

  static of<A>(sequence: [number, A][]) {
    return new TimedSource<A>(sequence.map(([duration, value]) => ({ duration, value }))).toSource();
  }

  static then<A>(duration: number, value: A) {
    return new TimedSource<A>().then(duration, value)
  }

  constructor(private readonly sequence: TimeStep<A>[] = []) {
  }

  then(duration: number, value: A): this {
    this.sequence.push({ duration, value })
    return this;
  }

  toSource() {
    return fromCallback<A>((push: (x: A) => void, done: () => void) => {
      const seq = new TimeSequence()
      this.sequence.forEach(({ duration, value }) => {
        seq.then(duration, () => push(value));
      });
      seq.run(done);
    })
  }
}

class WithTimeStage<I> extends FlowStage<I, [I, number]> {

  startTime?: number

  onStart() {
    this.startTime = new Date().getTime()
  }

  onPush() {
    if (!this.startTime) {
      throw new Error('Not ready!')
    }
    const x = this.grab()
    this.push([x, new Date().getTime() - this.startTime])
  }
}

export function withTime<A>(): Flow<A, [A, number]> {
  return createFlow(() => new WithTimeStage<A>())
}

type TimedEvent = {
  duration: number,
  action: () => void
}

class TimeSequence {

  events: TimedEvent[] = []

  static then(duration: number, action: () => void) {
    return new TimeSequence().then(duration, action);
  }

  then(duration: number, action: () => void) {
    this.events.push({ duration, action });
    return this;
  }

  run(callback = () => {}) {
    this.events.reverse().reduce((acc, { action, duration }) => () => {
      setTimeout(() => {
        action();
        acc();
      }, duration)
    }, callback)();
  }
}

export function timeChecker<A>(results: [A, number][], expected: [A, number][]) {
  results.map(x => {
    const rawTime = x[1];
    return [x[0], Math.floor((rawTime + 50) / 100) * 100];
  }).should.be.eql(expected);
}

export function delayed<A>(duration: number, result: A): Promise<A> {
  return new Promise(resolve => setTimeout(() => resolve(result), duration));
}

export function delayedFlow<A>(duration: number): Flow<A, A> {
  return delay(duration, 1, OverflowStrategy.BACK_PRESSURE)
}

export function checkTime(time: number, expectedTime: number) {
  time.should.be.above(expectedTime - 30);
  time.should.be.below(expectedTime + 30);
}
