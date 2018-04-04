import { DownstreamHandler, Stage } from './stage'
import Source from './source';
import Stream from './stream';

export function createFanIn<I, O>(size: number, stageFactory: (number) => FanInStage<I, O>): Stream<I, O> {
  return Stream.fromStageFactory(() => stageFactory(size), size);
}

const FanIn = {
  create: createFanIn
};

export function _registerSimpleFanIn(name, fanInName, stageFactory) {
  const fanInStreams = streams => Stream.groupStreams(streams)[fanInName]();
  Source[name] = (...sources) => fanInStreams(sources);
  FanIn[name] = size => createFanIn(size, stageFactory);
  Stream.prototype[name] = function (source) {
    return fanInStreams([this, source]);
  };
  Stream.prototype[fanInName] = function () {
    return this.fanIn(FanIn[name]);
  };
}

export default FanIn;

export abstract class FanInStage<I, O> extends Stage<I, O> {

  constructor(inputs: number) {
    super({ inputs });
  }

  createDownstreamHandler(index): DownstreamHandler {
    throw new Error('Not implemented');
  }

  // Not allowed methods

  onPush(): void {
    throw new Error('Not supported');
  }

  onError(e): void {
    throw new Error('Not supported');
  }

  onComplete(): void {
    throw new Error('Not supported');
  }

  grab(): void {
    throw new Error('Not supported');
  }

  pull(): void {
    throw new Error('Not supported');
  }

  pullIfAllowed(): void {
    throw new Error('Not supported');
  }

  isInputAvailable(): void {
    throw new Error('Not supported');
  }

  isInputClosed(): boolean {
    throw new Error('Not supported');
  }

  isInputHasBeenPulled(): boolean {
    throw new Error('Not supported');
  }

  isInputCanBePulled(): boolean {
    throw new Error('Not supported');
  }
}
