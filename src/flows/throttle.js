
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param duration
 * @param opts
 * @return {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function throttle(duration, opts = {}) {
  return create(() => new Throttle(duration, opts));
}

_registerFlow('throttle', throttle);

class Throttle extends Stage {

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
