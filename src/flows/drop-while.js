
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {function} fn
 * @returns {Flow}
 */
export function dropWhile(fn) {
  return create(() => new DropWhile(fn));
}

_registerFlow('dropWhile', dropWhile);

class DropWhile extends Stage {

  dropFinished = false;

  constructor(fn) {
    super();
    this.fn = fn;
  }

  onPush() {
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
