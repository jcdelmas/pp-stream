
import { Source, SourceStage , source } from '../core/source'

export function fromPromise<O>(promise: Promise<O>): Source<O> {
  return source(() => new PromiseSource(promise))
}

class PromiseSource<O> extends SourceStage<O> {

  constructor(private promise: Promise<O>) {
    super()
  }

  onPull(): void {
    this.promise.then(
      x => this.pushAndComplete(x),
      err => this.error(err)
    )
  }
}
