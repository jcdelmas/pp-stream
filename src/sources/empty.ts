import { Source, SourceStage , source } from '../core/source'

export const emptySource: Source<never> = source(() => new Empty())

class Empty extends SourceStage<never> {
  onPull() {
    this.complete()
  }
}
