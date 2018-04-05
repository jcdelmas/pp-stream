
import { Source, SourceStage } from '../core/source'

export function single<O>(x: O): Source<O, void> {
  return Source.fromStageFactory(() => new Single(x))
}

class Single<O> extends SourceStage<O, void> {

  constructor(private x: O) {
    super()
  }

  onPull() {
    this.pushAndComplete(this.x)
  }
}
