import { Stage, UpstreamHandler } from './stage'
import Stream from './stream';
import Flow from './flow';
import Sink from './sink';

export function createFanOut<I, O>(size: number, stageFactory: (number) => FanOutStage<I, O>) {
  return Stream.fromStageFactory<I, O>(() => stageFactory(size), 1, size);
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

export abstract class FanOutStage<I, O> extends Stage<I, O> {

  constructor(outputs: number) {
    super({ outputs })
  }

  createUpstreamHandler(index: number): UpstreamHandler {
    throw new Error('Not implemented');
  }

  // Not allowed methods

  onPull(): void {
    throw new Error('Not supported');
  }

  onCancel(): void {
    throw new Error('Not supported');
  }

  push(x: O): void {
    throw new Error('Not supported');
  }

  pushAndComplete(x: O): void {
    throw new Error('Not supported');
  }

  isOutputAvailable(): boolean {
    throw new Error('Not supported');
  }

  isOutputClosed(): boolean {
    throw new Error('Not supported');
  }
}
