
import { Source, SourceStage , source } from '../core/source';

export function unfoldAsync<O, S>(fn: (x: S) => Promise<[S, O] | undefined>, zero: S): Source<O> {
  return source(() => new UnfoldAsync(fn, zero))
}

class UnfoldAsync<O, S> extends SourceStage<O> {

  state: S

  constructor(private readonly fn: (x: S) => Promise<[S, O]>, zero: S) {
    super();
    this.state = zero;
  }

  onPull(): void {
    this.fn(this.state).then(result => {
      if (result) {
        const [newState, x] = result;
        this.push(x);
        this.state = newState;
      } else {
        this.complete();
      }
    }).catch(e => this.error(e));
  }
}
