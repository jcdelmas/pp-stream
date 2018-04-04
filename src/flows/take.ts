import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function take<A>(n: number): Flow<A, A> {
  return Flow.fromStageFactory(() => new Take<A>(n))
}

_registerFlow('take', take);

export class Take<A> extends FlowStage<A, A> {

  private count: number = 0

  constructor(private readonly nbr: number) {
    super();
    this.nbr = nbr;
  }

  onPush(): void {
    if (this.count++ < this.nbr) {
      this.push(this.grab());
    }
    if (this.count === this.nbr) {
      this.finish();
    }
  }
}
