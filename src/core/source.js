import Buffer from './buffer';
import { Stage } from './stage';
import Stream from './stream';
import Module from './module';

/**
 * @param stageProvider
 * @return {Stream}
 */
export function create(stageProvider) {
  return Stream.fromMaterializer(() => Module.sourceStage(stageProvider()));
}

/**
 * @param methods
 * @return {Stream}
 */
export function createSimple(methods) {
  return create(() => new SourceStage(methods));
}

/**
 * @param methods
 * @return {Stream}
 */
export function createPushOnly(methods) {
  return create(() => new PushSourceStage(methods));
}

const Source = {
  create,
  createSimple,
  createPushOnly
};

export default Source;

export class SourceStage extends Stage {

  onStart() {
    this.doStart();
  }

  onPull() {
  }

  onCancel() {
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

  start() {
    throw new Error('Not supported');
  }

  pull() {
    throw new Error('Not supported');
  }

  cancel() {
    throw new Error('Not supported');
  }

  finish() {
    throw new Error('Not supported');
  }

  _createNextDownstreamHandler() {
    throw new Error('Not supported');
  }

  _addInput(input) {
    throw new Error('Not supported');
  }
}

export class PushSourceStage extends SourceStage {

  completePending = false;

  constructor(props) {
    super(props);
    this.buffer = new Buffer(props.bufferSize, props.bufferOverflowStrategy)
  }

  push(x) {
    if (this.isOutputAvailable()) {
      super.push(x);
    } else {
      this.buffer.push(x);
    }
  }

  onPull() {
    if (!this.buffer.isEmpty()) {
      super.push(this.buffer.pull());

      if (this.completePending && this.buffer.isEmpty()) {
        super.complete();
      }
    }
  }

  complete() {
    if (this.buffer.isEmpty()) {
      super.complete();
    } else {
      this.completePending = true;
    }
  }
}
