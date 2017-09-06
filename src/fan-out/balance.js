
import { FanOutStage, _registerFanOut } from '../core/fan-out';

_registerFanOut('balance', size => new Balance(size));

class Balance extends FanOutStage {

  createUpstreamHandler(index) {
    return {
      onPull: () => {
        this.pullIfAllowed();
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
