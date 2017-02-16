"use strict";

import {
  Source,
  Flow,
  Sink,
  SinkStage
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

export class TimedSink extends SinkStage {

  index = 0;
  buffer = [];

  static of(sequence) {
    return Sink.create(() => new TimedSink(sequence));
  }

  constructor(sequence = []) {
    super();
    this.sequence = sequence;
  }

  onPush() {
    this.buffer.push(this.grab());
    this._runNextPull();
  }

  onComplete() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.resolve(this.buffer);
  }

  doStart() {
    this._runNextPull();
  }

  _runNextPull() {
    if (this.index < this.sequence.length) {
      this.currentTimeout = setTimeout(() => {
        this.pull();
      }, this.sequence[this.index++]);
    } else {
      this.complete(this.buffer);
    }
  }
}

export const WithTime = Flow.createSimple({
  doStart() {
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
  const result = results.map(x => {
    const rawTime = x[1];
    return [x[0], Math.floor((rawTime + 50) / 100) * 100];
  });
  expect(result).toEqual(expected);
}

export function delayed(duration, result) {
  return new Promise(resolve => setTimeout(() => resolve(result), duration));
}

export function delayedFlow(duration) {
  return Flow.mapAsync(x => delayed(duration, x));
}

export function checkTime(time, expectedTime) {
  expect(time).toBeGreaterThan(expectedTime - 30);
  expect(time).toBeLessThan(expectedTime + 30);
}

export function expectPromise(promise) {
  return {
    toThrowError(expectedError) {
      return promise.then(
        result => { throw new Error('Failure expected, but get ' + result) },
        err => expect(err).toEqual(expectedError)
      )
    },
    toThrow() {
      return promise.then(
        result => { throw new Error('Failure expected, but get ' + result) },
        err => {}
      )
    }
  };
}

