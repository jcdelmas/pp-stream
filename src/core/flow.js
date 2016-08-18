import { Stage } from './stage';
import Buffer, { OverflowStrategy } from './buffer';

export class BufferFlow extends Stage {

  pendingComplete = false;

  constructor(size, overflowStategy = OverflowStrategy.FAIL) {
    super();
    this.size = size;
    this.overflowStategy = overflowStategy;
    this.buffer = new Buffer(
      size,
      this.overflowStategy !== OverflowStrategy.BACK_PRESSURE
        ? this.overflowStategy
        : OverflowStrategy.FAIL
    );
  }

  doStart() {
    this.pull();
  }

  onPush() {
    const x = this.grab();
    if (this.buffer.isEmpty() && this.isOutputAvailable()) {
      this.push(x);
    } else {
      this.buffer.push(x);
    }
    if (this.overflowStategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
      this.pull();
    }
  }

  onPull() {
    if (!this.buffer.isEmpty()) {
      this.push(this.buffer.pull());
    }
    this.pullIfAllowed();
    if (this.pendingComplete && this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onComplete() {
    if (this.buffer.isEmpty()) {
      this.complete();
    } else {
      this.pendingComplete = true;
    }
  }
}

export class Scan extends Stage {
  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.acc = zero;
  }

  onPush() {
    this.acc = this.fn(this.acc, this.grab());
    this.push(this.acc);
  }
}

export class MapConcat extends Stage {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  /**
   * @type {number}
   */
  index = 0;

  /**
   * @type {Array|null}
   */
  current = null;

  onPush() {
    this.current = this.fn(this.grab());
    this._pushNextOrPull();
  }

  onPull() {
    this._pushNextOrPull();
  }

  onComplete() {
    if (!this.current) {
      this.complete();
    }
  }

  _pushNextOrPull() {
    if (this.current) {
      this.push(this.current[this.index++]);
      if (this.index >= this.current.length) {
        this.current = null;
        this.index = 0;
      }
    } else if (!this.inputs[0].isClosed()) {
      this.pull();
    } else {
      this.complete();
    }
  }
}

export class Grouped extends Stage {
  constructor(size) {
    super();
    this.size = size;
  }

  /**
   * @type {Array}
   */
  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length >= this.size) {
      this.push(this.buffer);
      this.buffer = [];
    } else {
      this.pull();
    }
  }

  onComplete() {
    if (this.buffer.length) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

export class Sliding extends Stage {
  constructor(size, step = 1) {
    super();
    this.size = size;
    this.step = step;
  }

  pendingData = false;

  buffer = [];

  onPush() {
    this.buffer.push(this.grab());
    if (this.buffer.length === this.size) {
      const newBuffer = this.buffer.slice(this.step);
      this.push(this.buffer);
      this.buffer = newBuffer;
      this.pendingData = false;
    } else {
      this.pull();
      this.pendingData = true;
    }
  }

  onComplete() {
    if (this.pendingData) {
      this.push(this.buffer);
    }
    this.complete();
  }
}

export class Take extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.finish();
    }
  }
}

export class TakeWhile extends Stage {

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
    const v = this.grab();
    if (this.fn(v)) {
      this.push(v);
    } else {
      this.finish();
    }
  }
}

export class Drop extends Stage {

  constructor(nbr) {
    super();
    this.nbr = nbr;
  }

  count = 0;

  onPush() {
    if (this.count++ < this.nbr) {
      this.pull();
    } else {
      this.push(this.grab());
    }
  }
}

export class DropWhile extends Stage {

  dropFinished = false;

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
    if (this.dropFinished) {
      this.push(this.grab());
    } else {
      const v = this.grab();
      if (this.fn(v)) {
        this.pull();
      } else {
        this.push(v);
        this.dropFinished = true;
      }
    }
  }
}

export class Delay extends Stage {

  constructor(duration, bufferSize = 16, overflowStrategy = OverflowStrategy.FAIL) {
    super();
    this.duration = duration;
    this.buffer = new Buffer(bufferSize, overflowStrategy, v => v.cancel());
    this.overflowStrategy = overflowStrategy;
  }

  doStart() {
    this.pull();
  }

  onPush() {
    this.buffer.push(new DelayedValue(this.grab(), this.duration, () => {
      if (this.isOutputAvailable()) {
        this.pushNext();
        if (this.overflowStrategy === OverflowStrategy.BACK_PRESSURE) {
          this.pullIfAllowed();
        }
      }
    }));
    if (this.overflowStrategy !== OverflowStrategy.BACK_PRESSURE || !this.buffer.isFull()) {
      this.pullIfAllowed();
    }
  }

  onComplete() {
    if (this.buffer.isEmpty()) {
      this.complete();
    }
  }

  onCancel() {
    this.buffer.drain().forEach(v => v.cancel());
    this.cancel();
  }

  onPull() {
    if (!this.buffer.isEmpty() && this.buffer.head().completed) {
      this.pushNext();
    }
  }

  pushNext() {
    this.push(this.buffer.pull().value);
    if (this.buffer.isEmpty() && this.isInputClosed()) {
      this.complete();
    }
  }
}

class DelayedValue {

  completed = false;

  constructor(value, duration, handler) {
    this.value = value;
    this.timeout = setTimeout(() => {
      this.completed = true;
      handler();
    }, duration);
  }

  cancel() {
    clearTimeout(this.timeout);
  }
}

export class Distinct extends Stage {

  last = null;

  onPush() {
    const x = this.grab();
    if (x != this.last) {
      this.push(x);
      this.last = x;
    } else {
      this.pull();
    }
  }
}

export class MapAsyncUnordered extends Stage {

  buffer = [];

  constructor(fn, parallelism = 1) {
    super();
    this.fn = fn;
    this.maxWorkers = parallelism;
    this.availableWorkers = parallelism;
  }

  doStart() {
    this.pull();
  }

  onPush() {
    if (this.availableWorkers === 0) {
      throw new Error('No available worker');
    }
    this.availableWorkers--;
    this._execute(this.grab());
    if (this.availableWorkers > 0) {
      this.pull();
    }
  }

  _execute(x) {
    this.fn(x).then(y => {
      if (this.isOutputAvailable()) {
        this.fullPush(y);
      } else {
        this.buffer.push(y);
      }
    }).catch(err => this.error(err));
  }

  fullPush(x) {
    this.push(x);
    this.availableWorkers++;
    if (!this.hasPendingJobs() && this.isInputClosed()) {
      this.complete();
    } else {
      this.pullIfAllowed();
    }
  }

  onPull() {
    if (this.buffer.length) {
      this.fullPush(this.buffer.shift());
    }
  }

  onComplete() {
    if (!this.hasPendingJobs()) {
      this.complete();
    }
  }

  hasPendingJobs() {
    return this.availableWorkers < this.maxWorkers;
  }
}

export class MapAsync extends MapAsyncUnordered {

  runningJobs = [];

  constructor(fn, parallelism = 1) {
    super(fn, parallelism);
  }

  _execute(x) {
    const job = new Job(() => this.fn(x));
    this.runningJobs.push(job);
    job.run().then(() => {
      while (this.runningJobs.length && this.runningJobs[0].completed) {
        const y = this.runningJobs.shift().result;
        if (this.isOutputAvailable()) {
          this.fullPush(y);
        } else {
          this.buffer.push(y);
        }
      }
    }).catch(err => this.error(err));
  }
}

class Job {

  completed = false;
  result = null;

  constructor(job) {
    this.job = job;
  }

  run() {
    return this.job().then(x => {
      this.result = x;
      this.completed = true;
    });
  }
}

export class Throttle extends Stage {

  pending = null;
  completePending = false;

  constructor(duration, { cost = 1, maximumBurst, costCalculation = x => 1, failOnPressure = false, elements }) {
    super();
    this.duration = duration;
    this.cost = elements || cost;
    this.maximumBurst = maximumBurst || this.cost;
    this.costCalculation = costCalculation;
    this.failOnPressure = failOnPressure;
    this.bucket = new TokenBucket(this.maximumBurst);
  }

  doStart() {
    this.bucket.offer(this.cost);
    this.timerId = setInterval(() => {
      this.bucket.offer(this.cost);
      if (this.pending && this.bucket.ask(this.costCalculation(this.pending))) {
        this.push(this.pending);
        this.pending = null;
        if (this.completePending) {
          this.complete();
          this.doFinish();
        }
      }
    }, this.duration);
  }

  onPush() {
    const x = this.grab();
    if (this.bucket.ask(this.costCalculation(x))) {
      this.push(x);
    } else if (this.failOnPressure) {
      this.error(new Error("Maximum throttle throughput exceeded."));
    } else {
      this.pending = x;
    }
  }

  onComplete() {
    if (this.pending) {
      this.completePending = true;
    } else {
      this.complete();
      this.doFinish();
    }
  }

  doFinish() {
    clearInterval(this.timerId);
  }
}

class TokenBucket {

  availableTokens = 0;

  constructor(maximumBurst) {
    this.maximumBurst = maximumBurst;
  }

  offer(cost) {
    this.availableTokens = Math.min(this.availableTokens + cost, this.maximumBurst);
  }

  ask(cost) {
    if (cost <= this.availableTokens) {
      this.availableTokens = this.availableTokens - cost;
      return true;
    } else {
      return false;
    }
  }
}