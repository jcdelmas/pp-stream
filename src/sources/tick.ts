
import { Source, SourceStage , source } from '../core/source';

export function tick<O>(interval: number, value: O): Source<O> {
  return source(() => new Tick(interval, value))
}

class Tick<O> extends SourceStage<O> {

  timerId?: NodeJS.Timer

  constructor(private interval: number, private value: O) {
    super()
  }

  onPull(): void {
  }

  onStart(): void {
    this.timerId = setInterval(() => {
      if (this.isOutputAvailable()) {
        this.push(this.value);
      }
    }, this.interval);
  }

  onCancel(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
