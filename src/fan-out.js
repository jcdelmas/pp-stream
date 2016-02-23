import { FanOutStage } from './stage';

export class Broadcast extends FanOutStage {

  started = false;

  createOutHandler(index) {
    if (this.started) {
      throw new Error('The graph is already started');
    }
    return {
      onPull: () => {
        this.started = true;
        this.pullIfReady();
      },
      onCancel: () => {
        if (!this.openOutputs().length) {
          this.cancel();
        } else {
          this.pullIfReady();
        }
      }
    };
  }

  pullIfReady() {
    if (this.openOutputs().every(o => o.isAvailable())) {
      this.pull();
    }
  }

  onPush() {
    const x = this.grab();
    this.openOutputs().forEach(output => output.push(x));
  }

  onError(e) {
    this.openOutputs().forEach(output => output.error(e));
  }

  openOutputs() {
    return this.outputs.filter(output => !output.isClosed());
  }
}
