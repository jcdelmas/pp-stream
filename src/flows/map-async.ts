import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function mapAsync<I, O>(fn: (x: I) => Promise<O>, parallelism: number = 1): Flow<I, O> {
  return flow<I, O>(() => new MapAsync(fn, parallelism));
}

export function mapAsyncUnordered<I, O>(fn: (x: I) => Promise<O>, parallelism = 1): Flow<I, O> {
  return flow(() => new MapAsyncUnordered(fn, parallelism));
}

declare module '../core/source' {
  interface Source<O> {
    mapAsync<O2>(fn: (x: O) => Promise<O2>, parallelism?: number): Source<O2>
    mapAsyncUnordered<O2>(fn: (x: O) => Promise<O2>, parallelism?: number): Source<O2>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    mapAsync<O2>(fn: (x: O) => Promise<O2>, parallelism?: number): Flow<I, O2>
    mapAsyncUnordered<O2>(fn: (x: O) => Promise<O2>, parallelism?: number): Flow<I, O2>
  }
}

_registerFlow('mapAsync', mapAsync);
_registerFlow('mapAsyncUnordered', mapAsyncUnordered);

class MapAsyncUnordered<I, O> extends FlowStage<I, O> {

  protected buffer: O[] = [];
  protected readonly maxWorkers: number
  protected availableWorkers: number

  constructor(protected readonly fn: (x: I) => Promise<O>, parallelism = 1) {
    super()
    this.maxWorkers = parallelism
    this.availableWorkers = parallelism
  }

  onStart(): void {
    this.pull();
  }

  onPush(): void {
    if (this.availableWorkers === 0) {
      throw new Error('No available worker');
    }
    this.availableWorkers--;
    this._execute(this.grab());
    if (this.availableWorkers > 0) {
      this.pull();
    }
  }

  _execute(x: I): void {
    this.fn(x).then(y => {
      if (this.isOutputAvailable()) {
        this.fullPush(y);
      } else {
        this.buffer.push(y);
      }
    }).catch(err => this.error(err));
  }

  fullPush(x: O): void {
    this.push(x);
    this.availableWorkers++;
    if (!this.hasPendingJobs() && this.isInputClosed()) {
      this.complete();
    } else {
      this.pullIfAllowed();
    }
  }

  onPull(): void {
    if (this.buffer.length) {
      this.fullPush(this.buffer.shift());
    }
  }

  onComplete(): void {
    if (!this.hasPendingJobs()) {
      this.complete();
    }
  }

  hasPendingJobs(): boolean {
    return this.availableWorkers < this.maxWorkers;
  }
}

class MapAsync<I, O> extends MapAsyncUnordered<I, O> {

  runningJobs: Job<O>[] = []

  constructor(fn: (x: I) => Promise<O>, parallelism: number = 1) {
    super(fn, parallelism);
  }

  _execute(x: I) {
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

class Job<A> {

  completed: boolean = false;
  result?: A;

  constructor(private readonly job: () => Promise<A>) {
  }

  run() {
    return this.job().then(x => {
      this.result = x;
      this.completed = true;
    });
  }
}
