
import Source, { create, SourceStage } from '../core/source';

/**
 * @param fn
 * @param zero
 * @return {Stream}
 */
export function unfold(fn, zero) {
  return create(() => new Unfold(fn, zero));
}

Source.unfold = unfold;

class Unfold extends SourceStage {

  constructor(fn, zero) {
    super();
    this.fn = fn;
    this.state = zero;
  }

  onPull() {
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
