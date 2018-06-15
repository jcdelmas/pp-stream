
import { Source, SourceStage , createSource } from '../core/source'

export function repeat<O>(x: O): Source<O> {
  return createSource(() => new Repeat(x))
}

class Repeat<O> extends SourceStage<O> {

  constructor(private x: O) {
    super()
  }

  onPull() {
    this.push(this.x)
  }
}
