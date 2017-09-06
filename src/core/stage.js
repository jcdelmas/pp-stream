import _ from 'lodash';

/**
 * @interface
 */
export class Inlet {

  /**
   * @param downstreamHandler
   */
  constructor(downstreamHandler) {
    this._downstreamHandler = downstreamHandler;
  }

  _setWire(wire) {
    if (this._wire) {
      throw new Error('Already wired!');
    }
    this._wire = wire;
  }

  isReady() {
    return !!this._wire;
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
   * @param upstreamHandler
   */
  constructor(upstreamHandler) {
    this._upstreamHandler = upstreamHandler;
  }

  /**
   * @param {Wire} wire
   */
  wire(inlet) {
    if (this._wire) {
      throw new Error('Already wired!');
    }
    this._wire = new Wire(this, inlet);
    inlet._setWire(this._wire);
  }

  isReady() {
    return !!this._wire;
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
   * @param {Inlet} inlet
   * @param {Outlet} outlet
   */
  constructor(outlet, inlet) {
    this._downstreamHandler = inlet._downstreamHandler;
    this._upstreamHandler = outlet._upstreamHandler;
  }

  hasPendingElement = false;
  waitingForPush = false;
  hasBeenPulled = false;

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

  pull() {
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
        } catch (e) {
          this.error(e);
        }
      } finally {
        this._asyncRequired = false;
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
  inputs;

  /**
   * @type {Outlet[]}
   */
  outputs;

  constructor({ onStart, doFinish, onPush, onPull, onComplete, onCancel, onError, inputs = 1, outputs = 1 } = {}) {
    if (onStart) this.onStart = onStart.bind(this);
    if (doFinish) this.doFinish = doFinish.bind(this);
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onComplete) this.onComplete = onComplete.bind(this);
    if (onCancel) this.onCancel = onCancel.bind(this);
    if (onError) this.onError = onError.bind(this);
    this.inputs = _.range(inputs).map(i => new Inlet(this.createDownstreamHandler(i)));
    this.outputs = _.range(outputs).map(i => new Outlet(this.createUpstreamHandler(i)));
  }

  // Lifecycle methods

  onStart() {
  }

  doFinish() {
  }

  // Downstream handler methods

  onPush() {
    this.push(this.grab());
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

  // Upstream handler methods

  onPull() {
    this.inputs.forEach(input => input.pullIfAllowed());
  }

  onCancel() {
    this.cancel();
    this.doFinish();
  }

  // General command methods

  finish() {
    this.cancel();
    this.doFinish();
    this.complete();
  }

  start() {
    this.onStart();
  }

  cancel() {
    this.inputs.forEach(input => {
      if (!input.isClosed()) {
        input.cancel();
      }
    });
  }

  complete() {
    this.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.complete();
      }
    });
  }

  error(e) {
    this.outputs.forEach(output => {
      if (!output.isClosed()) {
        output.error(e);
      }
    });
  }

  // Single input command methods

  grab() {
    return this.inputs[0].grab();
  }

  pull() {
    this.inputs[0].pull();
  }

  pullIfAllowed() {
    this.inputs[0].pullIfAllowed();
  }

  // Single input query methods

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

  // Single output command methods

  push(x) {
    this.outputs[0].push(x);
  }

  pushAndComplete(x) {
    this.push(x);
    this.complete();
  }

  // Single output query methods

  isOutputAvailable() {
    return this.outputs[0].isAvailable();
  }

  isOutputClosed() {
    return this.outputs[0].isClosed();
  }

  // Build methods

  createDownstreamHandler(index) {
    return this;
  }

  createUpstreamHandler(index) {
    return this;
  }
}
