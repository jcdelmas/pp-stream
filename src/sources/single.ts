
import { Source, SourceStage , createSource } from '../core/source'

export function single<O>(x: O): Source<O> {
  return createSource(() => new Single(x))
}

class Single<O> extends SourceStage<O> {

  constructor(private x: O) {
    super()
  }

  onPull() {
    this.pushAndComplete(this.x)
  }
}
