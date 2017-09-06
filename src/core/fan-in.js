import {Stage} from './stage';
import Source from './source';
import Stream from './stream';

export function createFanIn(size, stageFactory) {
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

export class FanInStage extends Stage {

  constructor(inputs) {
    super({ inputs });
  }

  createDownstreamHandler(index) {
    throw new Error('Not implemented');
  }

  // Not allowed methods

  onPush() {
    throw new Error('Not supported');
  }

  onError(e) {
    throw new Error('Not supported');
  }

  onComplete() {
    throw new Error('Not supported');
  }

  grab() {
    throw new Error('Not supported');
  }

  pull() {
    throw new Error('Not supported');
  }

  pullIfAllowed() {
    throw new Error('Not supported');
  }

  isInputAvailable() {
    throw new Error('Not supported');
  }

  isInputClosed() {
    throw new Error('Not supported');
  }

  isInputHasBeenPulled() {
    throw new Error('Not supported');
  }

  isInputCanBePulled() {
    throw new Error('Not supported');
  }
}
