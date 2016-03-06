import { FanOutStage } from './stage';

export class Broadcast extends FanOutStage {

  createOutHandler(index) {
    return {
      onPull: () => {
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

export class Balance extends FanOutStage {

  createOutHandler(index) {
    return {
      onPull: () => {
        if (!this.isInputHasBeenPulled()) {
          this.pull();
        }
      },
      onCancel: () => {
        if (!this.openOutputs().length) {
          this.cancel();
        }
      }
    };
  }

  onPush() {
    this.firstAvailableOutput().push(this.grab());
    if (this.firstAvailableOutput()) {
      this.pull();
    }
  }

  onError(e) {
    this.openOutputs().forEach(output => output.error(e));
  }

  openOutputs() {
    return this.outputs.filter(output => !output.isClosed());
  }

  firstAvailableOutput() {
    return this.outputs.find(output => output.isAvailable());
  }
}
