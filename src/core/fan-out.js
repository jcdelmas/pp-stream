import { Stage } from './stage';
import Source from './source';
import Stream from './stream';
import Module from './module';

export function create(stageProvider, streams) {
  return Stream.fromSourcedMaterializer(source => {
    const stage = stageProvider();
    const baseModule = source._materialize().wireFlow(stage);

    const fanOutSource = Source.create(() => stage);
    const modules = streams.map(stream => fanOutSource.pipe(stream)._materialize());
    return Module.merge(...modules).addSinks(baseModule._sinks);
  });
}

const FanOut = {
  create
};

export function _registerFanOut(name, fn) {
  FanOut[name] = fn;
  Stream.prototype[name] = function (...args) {
    return this.pipe(fn(...args));
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
