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

/**
 * @param {GraphInterface} left
 * @param {GraphInterface} right
 */
export function wire(left, right) {
  const output = left._nextOutput();
  const input = right._nextInput();
  const wire = new Wire(output.handler, input.handler);
  output.plug(wire.in);
  input.plug(wire.out);
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

  _nextInput() {
    const index = this.inputs.length;
    return {
      handler: this.createInHandler(index),
      plug: inlet => this.inputs.push(inlet)
    };
  }

  _nextOutput() {
    const index = this.outputs.length;
    return {
      handler: this.createOutHandler(index),
      plug: outlet => this.outputs.push(outlet)
    };
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
    if (onCancel) this.onComplete = onCancel.bind(this);
    if (onError) this.onError = onError.bind(this);
  }

  finished = false;

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
    this.finished = true;
    this.inputs[0].cancel();
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
    this.finished = true;
    this.outputs[0].complete();
  }

  finish() {
    this.cancel();
    this.complete();
  }

  /**
   * @param item
   */
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
}

export class SourceStage extends SimpleStage {

  onPull() {
    throw new Error('Not implemented');
  }

  onCancel() {
    this.finished = true;
  }

  pull() {
    throw new Error('Not allowed');
  }

  cancel() {
    throw new Error('Not allowed');
  }

  finish() {
    throw new Error('Not allowed');
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
    this.finished = true;
    this.resolve(result);
  }

  finish(result) {
    this.cancel();
    this.complete(result);
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

  _nextOutput(input) {
    throw new Error('Cannot add output to sink stage');
  }

  push() {
    throw new Error('Not allowed');
  }
}