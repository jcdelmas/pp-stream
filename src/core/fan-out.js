import { Stage } from './stage';
import Stream from './stream';
import Flow from './flow';
import Sink from './sink';

export function createFanOut(size, stageFactory) {
  return Stream.fromFlowStageFactory(() => stageFactory(size), 1, size);
}

const FanOut = {
  create: createFanOut
};

export function _registerFanOut(name, stageFactory) {
  FanOut[name] = size => createFanOut(size, stageFactory);
  Sink[name] = (...sinks) => Flow[name](...sinks);
  Stream.prototype[name] = function (...streams) {
    return this.pipe(FanOut[name](streams.length)).pipe(Stream.groupStreams(streams));
  };
}

export default FanOut;

export class FanOutStage extends Stage {

  constructor(outputs) {
    super({ outputs });
  }

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
