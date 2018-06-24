import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function throttle<A>(duration: number, opts: ThrottleOptions<A> = {}): Flow<A, A> {
  return flow(() => new Throttle<A>(duration, opts));
}

export type ThrottleOptions<A> = {
  cost?: number,
  maximumBurst?: number,
  costCalculation?: (x: A) => number,
  failOnPressure?: boolean,
  elements?: number
}

declare module 'core/source' {
  interface Source<O> {
    throttle(duration: number, opts?: ThrottleOptions<O>): Source<O>
  }
}

declare module 'core/flow' {
  interface Flow<I, O> {
    throttle(duration: number, opts?: ThrottleOptions<O>): Flow<I, O>
  }
}

_registerFlow('throttle', throttle);


class Throttle<A> extends FlowStage<A, A> {

  private pending?: A
  private completePending: boolean = false
  private duration: number
  private cost: number
  private maximumBurst: number
  private costCalculation: (x: A) => number
  private failOnPressure: boolean
  private bucket: TokenBucket
  private timerId?: NodeJS.Timer

  constructor(duration: number, opts: ThrottleOptions<A>) {
    super();
    const { cost = 1, maximumBurst, costCalculation = () => 1, failOnPressure = false, elements } = opts
    this.duration = duration;
    this.cost = elements || cost;
    this.maximumBurst = maximumBurst || this.cost;
    this.costCalculation = costCalculation;
    this.failOnPressure = failOnPressure;
    this.bucket = new TokenBucket(this.maximumBurst);
  }

  onStart(): void {
    this.bucket.offer(this.cost);
    this.timerId = setInterval(() => {
      this.bucket.offer(this.cost);
      if (this.pending && this.bucket.ask(this.costCalculation(this.pending))) {
        this.push(this.pending);
        this.pending = null;
        if (this.completePending) {
          this.onStop()
          this.complete()
        }
      }
    }, this.duration);
  }

  onPush(): void {
    const x = this.grab();
    if (this.bucket.ask(this.costCalculation(x))) {
      this.push(x);
    } else if (this.failOnPressure) {
      this.error(new Error("Maximum throttle throughput exceeded."));
    } else {
      this.pending = x;
    }
  }

  onComplete(): void {
    if (this.pending) {
      this.completePending = true;
    } else {
      this.onStop()
      this.complete()
    }
  }

  onStop() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}

class TokenBucket {

  private availableTokens = 0;

  constructor(private readonly maximumBurst: number) {
    this.maximumBurst = maximumBurst;
  }

  offer(cost: number): void {
    this.availableTokens = Math.min(this.availableTokens + cost, this.maximumBurst);
  }

  ask(cost: number): boolean {
    if (cost <= this.availableTokens) {
      this.availableTokens = this.availableTokens - cost;
      return true;
    } else {
      return false;
    }
  }
}
