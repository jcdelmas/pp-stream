import { Source, SourceStage } from '../core/source'

export const emptySource: Source<never> = Source.fromStageFactory(() => new Empty())

class Empty extends SourceStage<never> {
  onPull() {
    this.complete()
  }
}
