
import { Source, SourceStage } from '../core/source';

export function tick<O>(interval: number, value: O): Source<O, void> {
  return Source.fromStageFactory(() => new Tick(interval, value));
}

class Tick<O> extends SourceStage<O, void> {

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
