import { Source, SourceStage , createSource } from '../core/source'

export const emptySource: Source<never> = createSource(() => new Empty())

class Empty extends SourceStage<never> {
  onPull() {
    this.complete()
  }
}
