
import Buffer from './buffer';

/**
 * @interface
 */
export class Inlet {

  /**
   * @param {Wire} wire
   */
  constructor(wire) {
    this._wire = wire;
  }

  isAvailable() {
    return this._wire.hasPendingElement;
  }

  hasBeenPulled() {
    return this._wire.hasBeenPulled;
  }

  isClosed() {
    return this._wire.closed || this._wire.canceled;
  }

  canBePulled() {
    return !this.hasBeenPulled() && !this.isClosed();
  }

  grab() {
    return this._wire.grab();
  }

  start() {
    this._wire.start();
  }

  pull() {
    this._wire.pull();
  }

  pullIfAllowed() {
    if (this.canBePulled()) {
      this.pull();
    }
  }

  cancel() {
    this._wire.cancel();
  }
}

/**
 * @interface
 */
export class Outlet {

  /**
   * @param {Wire} wire
   */
  constructor(wire) {
    this._wire = wire;
  }

  isAvailable() {
    return this._wire.waitingForPush;
  }

  isClosed() {
    return this._wire.closed || this._wire.completed;
  }

  push(x) {
    this._wire.push(x);
  }

  error(e) {
    this._wire.error(e);
  }

  complete() {
    this._wire.complete();
  }
}

class Wire {
  /**
   * @param {UpstreamHandler} upstreamHandler
   * @param {DownstreamHandler} downstreamHandler
   */
  constructor(upstreamHandler, downstreamHandler) {
    this._downstreamHandler = downstreamHandler;
    this._upstreamHandler = upstreamHandler;
    this.in = new Outlet(this);
    this.out = new Inlet(this);
  }

  hasPendingElement = false;
  waitingForPush = false;
  hasBeenPulled = false;

  started = false;
  completed = false;
  canceled = false;
  closed = false;

  _pendingElement = null;

  _asyncRequired = false;

  grab() {
    if (!this.hasPendingElement) {
      throw new Error('No element available');
    }
    const el = this._pendingElement;
    this._resetElement();
    return el;
  }

  start() {
    if (this.started) {
      throw new Error('Already started');
    }
    this.started = true;
    this._asyncIfRequired(() => {
      this._upstreamHandler.onStart();
    });
  }

  pull() {
    if (!this.started) {
      throw new Error('Upstream stage not started');
    }
    if (this.closed || this.canceled) {
      throw new Error('Input closed');
    }
    if (this.hasBeenPulled) {
      throw new Error('Input already pulled');
    }
    if (this.completed) {
      return;
    }
    if (this.hasPendingElement) {
      this._resetElement();
    }
    this.hasBeenPulled = true;

    this._asyncIfRequired(() => {
      this.waitingForPush = true;
      this._upstreamHandler.onPull();
    });
  }

  cancel() {
    if (!this.started) {
      throw new Error('Not started');
    }
    if (this.closed || this.canceled) {
      throw new Error('Input already closed');
    }
    if (this.completed) {
      return;
    }
    this.hasBeenPulled = false;
    this.canceled = true;
    if (this.hasPendingElement) {
      this._resetElement();
    }
    this._asyncIfRequired(() => {
      this.closed = true;
      this.waitingForPush = false;
      this._upstreamHandler.onCancel();
    });
  }

  push(x) {
    if (!this.started) {
      throw new Error('Downstream stage not started');
    }
    if (this.closed || this.completed) {
      throw new Error('Output closed');
    }
    if (!this.waitingForPush) {
      throw new Error('Output not available');
    }
    if (this.canceled) {
      return;
    }
    this.waitingForPush = false;
    this._asyncIfRequired(() => {
      this.hasBeenPulled = false;
      this.hasPendingElement = true;
      this._pendingElement = x;
      this._downstreamHandler.onPush();
    });
  }

  error(e) {
    if (!this.started) {
      throw new Error('Not started');
    }
    this.waitingForPush = false;
    if (this.canceled) {
      return;
    }
    this.waitingForPush = false;
    this._asyncIfRequired(() => {
      this.hasBeenPulled = false;
      this._downstreamHandler.onError(e);
    });
  }

  complete() {
    if (!this.started) {
      throw new Error('Not started');
    }
    if (this.completed || this.closed) {
      throw new Error('Output already closed');
    }
    if (this.canceled) {
      return;
    }

    this.waitingForPush = false;
    this.completed = true;
    this._asyncIfRequired(() => {
      this.closed = true;
      this._downstreamHandler.onComplete();
    });
  }

  _resetElement() {
    this.hasPendingElement = false;
    this._pendingElement = null;
  }

  _asyncIfRequired(cb) {
    if (this._asyncRequired) {
      setImmediate(() => {
        try {
          cb()
        } catch (e) {
          this.error(e);
        }
      });
    } else {
      this._asyncRequired = true;
      try {
        try {
          cb()
        } finally {
          this._asyncRequired = false;
        }
      } catch (e) {
        this.error(e);
      }
    }
  }
}

/**
 * @interface
 */
export class DownstreamHandler {
  /**
   * @param item
   */
  onPush(item) {
    throw new Error('Not implemented');
  }

  /**
   * @param {Error} e
   */
  onError(e) {
    throw new Error('Not implemented');
  }

  onComplete() {
    throw new Error('Not implemented');
  }
}

/**
 * @interface
 */
export class UpstreamHandler {
  onStart() {
    throw new Error('Not implemented');
  }

  onPull() {
    throw new Error('Not implemented');
  }

  onCancel() {
    throw new Error('Not implemented');
  }
}

export class Stage {

  /**
   * @type {Inlet[]}
   */
  inputs = [];

  /**
   * @type {Outlet[]}
   */
  outputs = [];

  started = false;

  defaultUpstreamHandler = {
    onStart: () => {
      if (!this.started) {
        this.inputs.forEach(input => input.start());
        this.doStart();
        this.started = true;
      }
    }
  };

  doStart() {}

  doFinish() {}

  completeStage() {
    this.cancelAll();
    this.doFinish();
    this.completeAll();
  }

  cancelAll() {
    this.inputs.filter(input => !input.isClosed()).forEach(input => input.cancel());
  }

  completeAll() {
    this.outputs.filter(output => !output.isClosed()).forEach(output => output.complete());
  }

  /**
   * @param {Stage} downstreamStage
   */
  _addDownstreamStage(downstreamStage) {
    const wire = new Wire(
      this._createNextUpstreamHandler(),
      downstreamStage._createNextDownstreamHandler()
    );
    this.outputs.push(wire.in);
    downstreamStage._addInput(wire.out);
  }

  /**
   * @returns {UpstreamHandler}
   */
  _createNextUpstreamHandler() {
    const upstreamHandler = this.createUpstreamHandler(this.outputs.length);
    if (!upstreamHandler.onStart) {
      upstreamHandler.onStart = this.defaultUpstreamHandler.onStart;
    }
    return upstreamHandler;
  }

  /**
   * @returns {DownstreamHandler}
   */
  _createNextDownstreamHandler() {
    return this.createDownstreamHandler(this.inputs.length);
  }

  /**
   * @param {Inlet} input
   * @private
   */
  _addInput(input) {
    this.inputs.push(input)
  }

  /**
   * @return {DownstreamHandler}
   */
  createDownstreamHandler(index) {
    throw new Error('Not implemented');
  }

  /**
   * @return {UpstreamHandler}
   */
  createUpstreamHandler(index) {
    throw new Error('Not implemented');
  }
}

export class FanInStage extends Stage {

  createUpstreamHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist');
    }
    return this;
  }

  push(x) {
    this.outputs[0].push(x);
  }

  pushAndComplete(x) {
    this.push(x);
    this.complete();
  }

  error(e) {
    this.outputs[0].error(e);
  }

  complete() {
    this.outputs[0].complete();
  }

  isOutputAvailable() {
    return this.outputs[0].isAvailable();
  }

  isOutputClosed() {
    return this.outputs[0].isClosed();
  }

  onStart() {
    this.inputs.forEach(input => input.start());
  }

  onPull() {
    this.inputs.forEach(input => {
      if (input.canBePulled()) {
        input.pull();
      }
    });
  }

  onCancel() {
    this.inputs.forEach(input => {
      if (!input.isClosed()) {
        input.cancel();
      }
    });
  }
}

export class FanOutStage extends Stage {

  createDownstreamHandler(index) {
    if (index > 0) {
      throw new Error('Input already exist');
    }
    return this;
  }

  grab() {
    return this.inputs[0].grab();
  }

  start() {
    this.inputs[0].start();
  }

  pull() {
    this.inputs[0].pull();
  }

  pullIfAllowed() {
    this.inputs[0].pullIfAllowed();
  }

  cancel() {
    this.inputs[0].cancel();
  }

  isInputAvailable() {
    return this.inputs[0].isAvailable();
  }

  isInputClosed() {
    return this.inputs[0].isClosed();
  }

  isInputHasBeenPulled() {
    return this.inputs[0].hasBeenPulled();
  }

  onPush() {
    this.push(this.grab());
  }

  /**
   * @param {Error} e
   */
  onError(e) {
    this.outputs[0].error(e);
  }

  onComplete() {
    this.completeAll();
  }
}

/**
 * @implements {DownstreamHandler}
 * @implements {UpstreamHandler}
 */
export class SimpleStage extends Stage {

  constructor({ doStart, doFinish, onPush, onPull, onComplete, onCancel, onError } = {}) {
    super();
    if (doStart) this.doStart = doStart.bind(this);
    if (doFinish) this.doFinish = doFinish.bind(this);
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onComplete) this.onComplete = onComplete.bind(this);
    if (onCancel) this.onCancel = onCancel.bind(this);
    if (onError) this.onError = onError.bind(this);
  }

  createDownstreamHandler(index) {
    if (index > 0) {
      throw new Error('Input already exist');
    }
    return this;
  }

  createUpstreamHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist');
    }
    return this;
  }

  grab() {
    return this.inputs[0].grab();
  }

  start() {
    this.inputs[0].start();
  }

  pull() {
    this.inputs[0].pull();
  }

  pullIfAllowed() {
    this.inputs[0].pullIfAllowed();
  }

  cancel() {
    this.inputs[0].cancel();
  }

  isInputAvailable() {
    return this.inputs[0].isAvailable();
  }

  isInputClosed() {
    return this.inputs[0].isClosed();
  }

  isInputHasBeenPulled() {
    return this.inputs[0].hasBeenPulled();
  }

  isInputCanBePulled() {
    return this.inputs[0].canBePulled();
  }

  push(x) {
    this.outputs[0].push(x);
  }

  pushAndComplete(x) {
    this.push(x);
    this.complete();
  }

  error(e) {
    this.outputs[0].error(e);
  }

  complete() {
    this.outputs[0].complete();
  }

  isOutputAvailable() {
    return this.outputs[0].isAvailable();
  }

  isOutputClosed() {
    return this.outputs[0].isClosed();
  }

  onPush() {
    this.push(this.grab());
  }

  onStart() {
    this.start();
    this.doStart();
  }

  onPull() {
    this.pull();
  }

  /**
   * @param {Error} e
   */
  onError(e) {
    this.doFinish();
    this.error(e);
  }

  onComplete() {
    this.doFinish();
    this.complete();
  }

  onCancel() {
    this.cancel();
    this.doFinish();
  }
}

export class SourceStage extends SimpleStage {

  onStart() {
    this.doStart();
  }

  onPull() {
  }

  onCancel() {
  }

  start() {
    throw new Error('Not allowed');
  }

  pull() {
    throw new Error('Not allowed');
  }

  cancel() {
    throw new Error('Not allowed');
  }

  completeStage() {
    throw new Error('Not allowed');
  }

  _createNextDownstreamHandler() {
    throw new Error('Not allowed on source');
  }

  _addInput(input) {
    throw new Error('Not allowed on source');
  }
}

export class SinkStage extends SimpleStage {

  constructor(methods = {}) {
    super(methods);
    this.resultPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  onPush() {
    throw new Error('Not implemented');
  }

  complete(result) {
    if (!this.inputs[0].isClosed()) {
      this.cancel();
    }
    this.resolve(result);
  }

  error(e) {
    this.reject(e);
  }

  _getResult() {
    return this.resultPromise;
  }

  _addDownstreamStage(stage) {
    throw new Error('Not allowed on sink');
  }

  push() {
    throw new Error('Not allowed');
  }
}
