
import { Source, SourceStage } from '../core/source'

export function fromPromise<O>(promise: Promise<O>): Source<O, void> {
  return Source.fromStageFactory(() => new PromiseSource(promise));
}

class PromiseSource<O> extends SourceStage<O, void> {

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
