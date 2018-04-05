import { _registerFlow, Flow, FlowStage } from '../core/flow'

export function dropWhile<A>(fn: (x: A) => boolean): Flow<A, A, void> {
  return Flow.fromStageFactory(() => new DropWhile<A>(fn))
}

_registerFlow('dropWhile', dropWhile);

class DropWhile<A> extends FlowStage<A, A, void> {

  private dropFinished: boolean = false

  constructor(private readonly fn: (x: A) => boolean) {
    super()
  }

  onPush(): void {
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
