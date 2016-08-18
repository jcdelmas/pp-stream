
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

export function distinct() {
  return create(() => new Distinct())
}

_registerFlow('distinct', distinct);

export class Distinct extends Stage {

  last = null;

  onPush() {
    const x = this.grab();
    if (x != this.last) {
      this.push(x);
      this.last = x;
    } else {
      this.pull();
    }
  }
}
