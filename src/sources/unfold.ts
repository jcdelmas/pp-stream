
import { Source, SourceStage , source } from '../core/source';

export function unfold<O, S>(fn: (x: S) => [S, O] | undefined, zero: S): Source<O> {
  return source(() => new Unfold(fn, zero))
}

class Unfold<O, S> extends SourceStage<O> {

  state: S

  constructor(private readonly fn: (x: S) => [S, O], zero: S) {
    super()
    this.state = zero
  }

  onPull(): void {
    const result = this.fn(this.state);
    if (result) {
      const [newState, x] = result;
      this.push(x);
      this.state = newState;
    } else {
      this.complete();
    }
  }
}
