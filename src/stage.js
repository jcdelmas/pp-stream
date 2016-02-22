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

  pull() {
    this._wire.in._available = true;
    this._handler.onPull();
  }

  cancel() {
    this._wire.in._available = false;
    this._handler.onDownstreamFinish();
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

  isAvailable() {
    return this._available;
  }

  push(x) {
    this._available = false;
    setImmediate(() => {
      try {
        this._handler.onPush(x);
      } catch (e) {
        this.error(e);
      }
    });
  }

  pushAndFinish(x) {
    this.push(x);
    this.finish();
  }

  error(e) {
    this._available = false;
    setImmediate(() => {
      this._handler.onError(e);
    });
  }

  complete() {
    this._available = false;
    setImmediate(() => {
      this._handler.onUpstreamFinish();
    });
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
 * @implements InHandler
 * @implements OutHandler
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
  onPush(item) {
    this.push(item);
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