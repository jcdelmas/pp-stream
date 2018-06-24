
import { Source, PushSourceStage , source } from '../core/source';
import { OverflowStrategy } from '../core/buffer';

type Callbacks<O> = (push: (x: O) => void, done: () => void, error: (error: any) => void) => void

export function fromCallback<O>(callback: Callbacks<O>, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL): Source<O> {
  return source(() => new CallbackSourceStage(callback, bufferSize, bufferOverflowStrategy));
}


class CallbackSourceStage<O> extends PushSourceStage<O> {

  constructor(private callback: Callbacks<O>, bufferSize: number = 16, bufferOverflowStrategy: OverflowStrategy = OverflowStrategy.FAIL) {
    super({ bufferSize, bufferOverflowStrategy });
  }

  onStart(): void {
    this.callback(
      x => this.push(x),
      () => this.complete(),
      e => this.error(e)
    );
  }
}
