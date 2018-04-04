import { some } from 'lodash'
import { Startable, Shape } from './stage'
import { StreamAttributes } from './stream'

export default class Module<S extends Shape, M> implements Startable {

  constructor(public readonly shape: S,
              public readonly submodules: Startable[],
              public readonly attrs: StreamAttributes,
              public readonly materializedValue: M) {
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
