/**
 * @interface
 */
export class Inlet {

  pull() {
    throw new Error('Not implemented');
  }

  cancel() {
    throw new Error('Not implemented');
  }
}

/**
 * @interface
 */
export class Outlet {

  isAvailable() {
    throw new Error('Not implemented');
  }

  push(x) {
    throw new Error('Not implemented');
  }

  pushAndFinish(x) {
    throw new Error('Not implemented');
  }

  error(e) {
    throw new Error('Not implemented');
  }

  complete() {
    throw new Error('Not implemented');
  }
}

/**
 * @implements {Inlet}
 * @implements {Outlet}
 */
export class Wire {
  /**
   * @param {OutHandler} outHandler
   * @param {InHandler} inHandler
   */
  constructor(outHandler, inHandler) {
    this.outHandler = outHandler;
    this.inHandler = inHandler;
  }

  available = false;

  isAvailable() {
    return this.available;
  }

  push(x) {
    this.available = false;
    setImmediate(() => {
      try {
        this.inHandler.onPush(x);
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
    this.available = false;
    setImmediate(() => {
      this.inHandler.onError(e);
    });
  }

  complete() {
    this.available = false;
    setImmediate(() => {
      this.inHandler.onUpstreamFinish();
    });
  }

  pull() {
    this.available = true;
    this.outHandler.onPull();
  }

  cancel() {
    this.available = false;
    this.outHandler.onDownstreamFinish();
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

export class Stage {

  /**
   * @type {Inlet[]}
   */
  inputs = [];

  /**
   * @type {Outlet[]}
   */
  outputs = [];

  nextInput() {
    const index = this.inputs.length;
    return {
      handler: this.createInHandler(index),
      setInlet: inlet => this.inputs.push(inlet)
    };
  }

  nextOutput() {
    const index = this.outputs.length;
    return {
      handler: this.createOutHandler(index),
      setOutlet: outlet => this.outputs.push(outlet)
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

  first() {
    return this;
  }

  last() {
    return this;
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
      throw new Error('Input already exist !');
    }
    return this;
  }

  createOutHandler(index) {
    if (index > 0) {
      throw new Error('Output already exist !');
    }
    return this;
  }

  first() {
    return this;
  }

  last() {
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

  getResult() {
    return this.resultPromise;
  }

  nextOutput(input) {
    throw new Error('Cannot add output to sink stage');
  }

  push() {
    throw new Error('Not allowed');
  }
}