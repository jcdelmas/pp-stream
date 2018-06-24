
import { _registerFlow, FlowStage, Flow , flow } from '../core/flow'

export function filter<A>(fn: (x: A) => boolean): Flow<A, A> {
  return flow(() => new Filter(fn))
}

declare module '../core/source' {
  interface Source<O> {
    filter(fn: (x: O) => boolean): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    filter(fn: (x: O) => boolean): Flow<I, O>
  }
}

_registerFlow('filter', filter)

class Filter<A> extends FlowStage<A, A> {
  
  constructor (private readonly fn: (x: A) => boolean) {
    super()
  }
  
  onPush() {
    const x = this.grab();
    if (this.fn(x)) {
      this.push(x)
    } else {
      this.pull();
    }
  }
}
