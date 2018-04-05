import { Source, SourceStage } from '../core/source'

export const emptySource: Source<never, void> = Source.fromStageFactory(() => new Empty())

class Empty extends SourceStage<never, void> {
  onPull() {
    this.complete()
  }
}
