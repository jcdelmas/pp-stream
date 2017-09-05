import { Stage } from './stage';
import Stream from './stream';

export function createFanOut(stageFactory) {
  return Stream.fromFlowStageFactory(stageFactory);
}

const FanOut = {
  create: createFanOut
};

export function _registerFanOut(name, stageFactory) {
  FanOut[name] = (...streams) => {
    const fanOut = createFanOut(stageFactory);
    return streams.length > 0 ? fanOut.fanOut(...streams) : fanOut;
  };
  Stream.prototype[name] = function (...streams) {
    return this.pipe(FanOut[name]()).fanOut(...streams);
  };
}

export default FanOut;

export class FanOutStage extends Stage {

  createUpstreamHandler(index) {
    throw new Error('Not implemented')
  }

  // Not allowed methods

  onStart() {
    throw new Error('Not supported');
  }

  onPull() {
    throw new Error('Not supported');
  }

  onCancel() {
    throw new Error('Not supported');
  }

  push(x) {
    throw new Error('Not supported');
  }

  pushAndComplete(x) {
    throw new Error('Not supported');
  }

  isOutputAvailable() {
    throw new Error('Not supported');
  }

  isOutputClosed() {
    throw new Error('Not supported');
  }
}
