
import Source, { create, SourceStage } from '../core/source';

/**
 * @param fn
 * @param zero
 * @return {Stream}
 */
export function unfoldAsync(fn, zero) {
  return create(() => new UnfoldAsync(fn, zero));
}

Source.unfoldAsync = unfoldAsync;

class UnfoldAsync extends SourceStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.state = zero;
  }

  onPull() {
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
