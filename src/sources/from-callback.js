
import Source, { create, PushSourceStage } from '../core/source';
import { OverflowStrategy } from '../core/buffer';

export function fromCallback(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
  return create(() => new CallbackSourceStage(callback, bufferSize, bufferOverflowStrategy));
}

Source.fromCallback = fromCallback;

class CallbackSourceStage extends PushSourceStage {

  constructor(callback, bufferSize = 16, bufferOverflowStrategy = OverflowStrategy.FAIL) {
    super({ bufferSize, bufferOverflowStrategy });
    this.callback = callback;
  }

  doStart() {
    this.callback(
      x => this.push(x),
      () => this.complete(),
      e => this.error(e)
    );
  }
}
