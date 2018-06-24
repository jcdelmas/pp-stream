import { _registerFlow, Flow, FlowStage , flow } from '../core/flow'

export function dropWhile<A>(fn: (x: A) => boolean): Flow<A, A> {
  return flow(() => new DropWhile<A>(fn))
}

declare module '../core/source' {
  interface Source<O> {
    dropWhile(fn: (x: O) => boolean): Source<O>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    dropWhile(fn: (x: O) => boolean): Flow<I, O>
  }
}

_registerFlow('dropWhile', dropWhile);

class DropWhile<A> extends FlowStage<A, A> {

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
