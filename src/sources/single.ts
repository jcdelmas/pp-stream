
import { Source, SourceStage } from '../core/source'

export function single<O>(x: O): Source<O> {
  return Source.fromStageFactory(() => new Single(x))
}

class Single<O> extends SourceStage<O> {

  constructor(private x: O) {
    super()
  }

  onPull() {
    this.pushAndComplete(this.x)
  }
}
