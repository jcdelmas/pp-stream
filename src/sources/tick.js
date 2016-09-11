
import Source, { create, SourceStage } from '../core/source';

export function tick(interval, value) {
  return create(() => new Tick(interval, value));
}

Source.tick = tick;

class Tick extends SourceStage {

  constructor(interval, value) {
    super();
    this.interval = interval;
    this.value = value;
  }

  doStart() {
    this.timerId = setInterval(() => {
      if (this.isOutputAvailable()) {
        this.push(this.value);
      }
    }, this.interval);
  }

  onCancel() {
    clearInterval(this.timerId);
  }
}
