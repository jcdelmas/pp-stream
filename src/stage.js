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

  grab() {
    return this._wire.grab();
  }

  pull() {
    this._wire.pull();
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

  pushAndComplete(x) {
    this.push(x);
    this.complete();
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
   * @param {OutHandler} outHandler
   * @param {InHandler} inHandler
   */
  constructor(outHandler, inHandler) {
    this.inHandler = inHandler;
    this.outHandler = outHandler;
    this.in = new Outlet(this);
    this.out = new Inlet(this);
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
      this.outHandler.onPull();
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
      this.outHandler.onCancel();
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
      this.inHandler.onPush();
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
      this.inHandler.onError(e);
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
      this.hasBeenPulled = false;
      this.inHandler.onComplete();
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
export class InHandler {

  constructor({ onPush, onComplete, onError } = {}) {
    if (onPush) this.onPush = onPush;
    if (onComplete) this.onComplete = onComplete;
    if (onError) this.onError = onError;
  }

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
export class OutHandler {

  constructor({ onPull, onCancel } = {}) {
    if (onPull) this.onPull = onPull;
    if (onCancel) this.onComplete = onCancel;
  }

  onPull() {
    throw new Error('Not implemented');
  }

  onCancel() {
    throw new Error('Not implemented');
  }
}

/**
 * @implements {GraphInterface}
 */
export class Stage {

  /**
   * @type {Inlet[]}
   */
  inputs = [];

  /**
   * @type {Outlet[]}
   */
  outputs = [];

  completeStage() {
    this.cancelAll();
    this.completeAll();
  }

  cancelAll() {
    this.inputs.filter(input => !input.isClosed()).forEach(input => input.cancel());
  }

  completeAll() {
    this.outputs.filter(output => !output.isClosed()).forEach(output => output.complete());
  }

  _subscribe(subscriber) {
    const index = this.outputs.length;
    const wire = new Wire(this.createOutHandler(index), subscriber._nextHandler());
    this.outputs.push(wire.in);
    subscriber._onSubscribe(wire.out);
  }

  _nextHandler() {
    return this.createInHandler(this.inputs.length);
  }

  _onSubscribe(input) {
    this.inputs.push(input)
  }

  /**
   * @return {InHandler}
   */
  createInHandler(index) {
    throw new Error('Not implemented');
  }

  /**
   * @return {OutHandler}
   */
  createOutHandler(index) {
    throw new Error('Not implemented');
  }
}

export class FanInStage extends Stage {

  createOutHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist');
    }
    return this;
  }

  push(x) {
    this.outputs[0].push(x);
  }

  pushAndComplete(x) {
    this.outputs[0].pushAndComplete(x);
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

  onPull() {
    this.pull()
  }

  onCancel() {
    this.cancel();
  }
}

export class FanOutStage extends Stage {

  createInHandler(index) {
    if (index > 0) {
      throw new Error('Input already exist');
    }
    return this;
  }

  grab() {
    return this.inputs[0].grab();
  }

  pull() {
    this.inputs[0].pull();
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

  nextSubscriber() {
    throw new Error('Not allowed on simple stage');
  }
}

/**
 * @implements {InHandler}
 * @implements {OutHandler}
 */
export class SimpleStage extends Stage {

  constructor({ onPush, onPull, onComplete, onCancel, onError } = {}) {
    super();
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onComplete) this.onComplete = onComplete.bind(this);
    if (onCancel) this.onCancel = onCancel.bind(this);
    if (onError) this.onError = onError.bind(this);
  }

  createInHandler(index) {
    if (index > 0) {
      throw new Error('Input already exist');
    }
    return this;
  }

  createOutHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist');
    }
    return this;
  }

  grab() {
    return this.inputs[0].grab();
  }

  pull() {
    this.inputs[0].pull();
  }

  cancel() {
    this.inputs[0].cancel();
  }

  isInputAvailable() {
    this.inputs[0].isAvailable();
  }

  isInputClosed() {
    this.inputs[0].isClosed();
  }

  isInputHasBeenPulled() {
    this.inputs[0].isInputHasBeenPulled();
  }

  push(x) {
    this.outputs[0].push(x);
  }

  pushAndComplete(x) {
    this.outputs[0].pushAndComplete(x);
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

  onPull() {
    this.pull()
  }

  /**
   * @param {Error} e
   */
  onError(e) {
    this.error(e);
  }

  onComplete() {
    this.complete();
  }

  onCancel() {
    this.cancel();
  }

  nextSubscriber() {
    throw new Error('Not allowed on simple stage');
  }
}

export class SourceStage extends SimpleStage {

  onPull() {
    throw new Error('Not implemented');
  }

  onCancel() {
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

  _nextHandler() {
    throw new Error('Not allowed on source');
  }

  _onSubscribe(input) {
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

  _getLastStage() {
    return this;
  }

  _subscribe(subscriber) {
    throw new Error('Not allowed on sink');
  }

  push() {
    throw new Error('Not allowed');
  }
}

export class CompoundSinkStage extends SinkStage {

  /**
   *
   * @param {SinkStage[]} sinks
   */
  constructor(sinks) {
    super();
    this.sinks = sinks;
  }

  pull() {
    this.sinks.forEach(s => s.pull());
  }

  _getResult() {
    return Promise.all(this.sinks.map(s => s._getResult()));
  }
}
