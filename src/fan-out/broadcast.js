
import { FanOutStage, create, _registerFanOut } from '../core/fan-out';

/**
 * @return {Stream}
 *
 * @memberOf Stream#
 * @memberOf FanOut
 */
export function broadcast(...streams) {
  return create(() => new Broadcast(), streams);
}

_registerFanOut('broadcast', broadcast);

class Broadcast extends FanOutStage {

  createUpstreamHandler(index) {
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
