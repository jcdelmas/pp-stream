import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function distinct<A>(): Flow<A, A, void> {
  return Flow.fromStageFactory<A, A, void>(() => new Distinct<A>())
}

_registerFlow('distinct', distinct);

export class Distinct<A> extends FlowStage<A, A, void> {

  last?: A = null

  onPush(): void {
    const x = this.grab();
    if (x != this.last) {
      this.push(x);
      this.last = x;
    } else {
      this.pull();
    }
  }
}
