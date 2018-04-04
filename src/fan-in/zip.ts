import { createFanIn, default as FanIn, FanInStage } from '../core/fan-in'
import Stream from '../core/stream'
import { Inlet, Outlet, Shape } from '../core/stage'

export function zipSources<O>(...sources: Stream<never, O>[]): Stream<never, O> {
  return Stream.groupStreams(sources).zipStreams()
}

export function zip<A>(size): Stream<A, A> {
  return createFanIn(size, size => new Zip(size));
}

Stream.prototype.zip = function (source) {
  return fanInStreams([this, source]);
};
Stream.prototype.zipStreams = function () {
  return this.fanIn(FanIn.zip);
};

export class Zip<A1, A2> extends FanInStage<{ in1: Inlet<A1>, in2: Inlet<A2>, output: Outlet<[A1, A2]> } & Shape> {

  createDownstreamHandler(index) {
    return {
      onPush: () => {
        if (this.inputs.every(i => i.isAvailable())) {
          this.push(this.inputs.map(i => i.grab()));

          if (this.inputs.some(i => i.isClosed())) {
            this.finish();
          }
        }
      },
      onComplete: () => {
        if (!this.isOutputClosed() && !this.inputs[index].isAvailable()) {
          this.finish();
        }
      },
      onError: e => this.error(e)
    };
  }

  onPull() {
    this.inputs.forEach(i => i.pull());
  }

  onCancel() {
    this.cancelAll();
  }
}