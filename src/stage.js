/**
 * @interface
 */
export class Inlet {

  /**
   * @param {OutHandler} handler
   * @param {Wire} wire
   */
  constructor(handler, wire) {
    this._handler = handler;
    this._wire = wire;
  }

  _available = false;
  _hasBeenPulled = false;
  _closed = false;
  _pendingElement = null;

  isAvailable() {
    return this._available;
  }

  hasBeenPulled() {
    return this._hasBeenPulled;
  }

  isClosed() {
    return this._closed;
  }

  grab() {
    if (!this._available) {
      throw new Error('No element available');
    }
    const el = this._pendingElement;
    this._resetElement();
    return el;
  }

  pull() {
    if (this._hasBeenPulled) {
      throw new Error('Input already pulled');
    }
    if (this._closed) {
      throw new Error('Input closed');
    }
    this._outlet()._onPull();
    if (this._available) {
      this._resetElement();
    }
    this._hasBeenPulled = true;
    this._handler.onPull();
  }

  cancel() {
    if (this._closed) {
      throw new Error('Input already closed');
    }
    this._outlet()._onCancel();
    if (this._available) {
      this._resetElement();
    }
    this._closed = true;
    this._available = false;
    this._hasBeenPulled = false;
    this._handler.onDownstreamFinish();
  }

  _onPush(x) {
    if (!this._hasBeenPulled) {
      throw new Error('Output not pulled');
    }
    this._available = true;
    this._hasBeenPulled = false;
    this._pendingElement = x;
  }

  _onComplete() {
    this._closed = true;
    this._hasBeenPulled = false;
  }

  _outlet() {
    return this._wire.in;
  }

  _resetElement() {
    this._available = false;
    this._pendingElement = null;
  }
}

/**
 * @interface
 */
export class Outlet {

  /**
   * @param {InHandler} handler
   * @param {Wire} wire
   */
  constructor(handler, wire) {
    this._handler = handler;
    this._wire = wire;
  }

  _available = false;
  _closed = false;

  isAvailable() {
    return this._available;
  }

  isClosed() {
    return this._closed;
  }

  push(x) {
    if (!this._available) {
      throw new Error('Output not available');
    }
    if (this._closed) {
      throw new Error('Output closed');
    }
    this._inlet()._onPush(x);
    this._available = false;
    setImmediate(() => {
      try {
        this._handler.onPush();
      } catch (e) {
        this.error(e);
      }
    });
  }

  pushAndComplete(x) {
    this.push(x);
    this.complete();
  }

  error(e) {
    this._available = false;
    setImmediate(() => {
      this._handler.onError(e);
    });
  }

  complete() {
    if (this._closed) {
      throw new Error('Output already closed');
    }
    this._inlet()._onComplete();

    this._available = false;
    this._closed = true;
    setImmediate(() => {
      this._handler.onUpstreamFinish();
    });
  }

  _onPull() {
    if (this._available) {
      throw new Error('Input already pulled');
    }
    this._available = true;
  }

  _onCancel() {
    if (this._closed) {
      throw new Error('Input already closed');
    }
    this._available = false;
    this._closed = true;
  }

  _inlet() {
    return this._wire.out;
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
    this.in = new Outlet(inHandler, this);
    this.out = new Inlet(outHandler, this);
  }
}

/**
 * @interface
 */
export class InHandler {

  constructor({ onPush, onUpstreamFinish, onError } = {}) {
    if (onPush) this.onPush = onPush;
    if (onUpstreamFinish) this.onUpstreamFinish = onUpstreamFinish;
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

  onUpstreamFinish() {
    throw new Error('Not implemented');
  }
}

/**
 * @interface
 */
export class OutHandler {

  constructor({ onPull, onDownstreamFinish } = {}) {
    if (onPull) this.onPull = onPull;
    if (onDownstreamFinish) this.onUpstreamFinish = onDownstreamFinish;
  }

  onPull() {
    throw new Error('Not implemented');
  }

  onDownstreamFinish() {
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

  constructor({ onPush, onPull, onUpstreamFinish, onDownstreamFinish, onError } = {}) {
    super();
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onUpstreamFinish) this.onUpstreamFinish = onUpstreamFinish.bind(this);
    if (onDownstreamFinish) this.onUpstreamFinish = onDownstreamFinish.bind(this);
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

  pushAndFinish(x) {
    this.outputs[0].pushAndFinish(x);
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

  onUpstreamFinish() {
    this.complete();
  }

  onDownstreamFinish() {
    this.cancel();
  }
}

export class SourceStage extends SimpleStage {

  onPull() {
    throw new Error('Not implemented');
  }

  onDownstreamFinish() {
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