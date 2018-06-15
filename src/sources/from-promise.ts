
import { Source, SourceStage , createSource } from '../core/source'

export function fromPromise<O>(promise: Promise<O>): Source<O> {
  return createSource(() => new PromiseSource(promise))
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
