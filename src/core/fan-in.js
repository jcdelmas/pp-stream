"use strict";

import { Stage } from './stage';
import Source from './source';
import Flow from './flow';
import Stream from './stream';

export function createFanIn(stageFactory) {
  return Flow.create(stageFactory);
}

const FanIn = {
  create: createFanIn
};

export function _registerSimpleFanIn(name, fanInName, stageFactory) {
  Source[name] = (...sources) => FanIn[name](...sources);
  FanIn[name] = (...streams) => {
    const fanIn = createFanIn(stageFactory);
    return streams.length > 0 ? Stream.groupStreams(streams).fanIn(fanIn) : fanIn;
  };
  Stream.prototype[name] = function (source) {
    return FanIn[name](this, source);
  };
  Stream.prototype[fanInName] = function () {
    return this.fanIn(FanIn[name]());
  };
}

export default FanIn;

export class FanInStage extends Stage {

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
