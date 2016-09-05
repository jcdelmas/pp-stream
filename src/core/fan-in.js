"use strict";

import { Stage } from './stage';
import Source from './source';
import Flow from './flow';
import Stream from './stream';
import Module from './module';

/**
 * @param stageFactory
 * @param {Stream[]} sources
 * @return {Stream}
 */
export function createSource(stageFactory, sources) {
  return Stream.fromMaterializer(() => {
    return Module.merge(...sources.map(s => s._materialize()))
      .wireFlow(stageFactory());
  });
}

export function createFlow(sourceFactory, source) {
  return Stream.fromSourceFactory(firstSource => sourceFactory(firstSource, source));
}

export function createFanIn(stageFactory) {
  return Flow.create(stageFactory);
}

const FanIn = {
  createSource,
  createFanIn
};

export function _registerSimpleFanIn(name, fanInName, stageFactory) {
  Source[name] = (...sources) => createSource(stageFactory, sources);
  Flow[name] = source => createFlow(Source[name], source);
  FanIn[name] = () => createFanIn(stageFactory);
  Stream.prototype[name] = function (...sources) {
    return this.pipe(Flow[name](...sources));
  };
  Stream.prototype[fanInName] = function () {
    return this.pipe(FanIn[name]());
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
