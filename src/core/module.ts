import { some } from 'lodash'
import { Shape, Startable } from './stage'

export default class Module<S extends Shape, R> implements Startable {

  constructor(public readonly shape: S,
              public readonly submodules: Startable[],
              public readonly result: R) {
  }

  start(): void {
    if (some(this.shape.inputs, i => !i.isReady())) {
      throw new Error('Not wired input');
    }
    if (some(this.shape.outputs, o => !o.isReady())) {
      throw new Error('Not wired input');
    }
    this.submodules.forEach(m => m.start());
  }
}
