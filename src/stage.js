import { EventEmitter } from 'events';

export default class Stage {

  constructor({ onPush, onPull, onUpstreamFinish, onDownstreamFinish, onError } = {}) {
    if (onPush) this.onPush = onPush.bind(this);
    if (onPull) this.onPull = onPull.bind(this);
    if (onUpstreamFinish) this.onUpstreamFinish = onUpstreamFinish.bind(this);
    if (onDownstreamFinish) this.onUpstreamFinish = onDownstreamFinish.bind(this);
    if (onError) this.onError = onError.bind(this);
  }

  finished = false;

  /**
   * @type {Stage|null}
   */
  input = null;

  /**
   * @type {Stage|null}
   */
  output = null;

  wireInput(input) {
    if (this.input) {
      throw new Error('Input already exist !');
    }
    this.input = input;
  }

  wireOutput(output) {
    if (this.output) {
      throw new Error('Output already exist !');
    }
    this.output = output;
  }

  first() {
    return this;
  }

  last() {
    return this;
  }

  push(x) {
    setImmediate(() => {
      try {
        this.output.onPush(x);
      } catch (e) {
        this.error(e);
      }
    });
  }

  pushAndFinish(x) {
    this.push(x);
    this.finish();
  }

  pull() {
    this.input.onPull();
  }

  error(e) {
    setImmediate(() => {
      this.output.onError(e);
    });
  }

  finish() {
    this.finished = true;
    if (this.input && !this.input.finished) {
      this.input.onDownstreamFinish();
    }
    if (this.output && !this.output.finished) {
      setImmediate(() => {
          this.output.onUpstreamFinish();
      });
    }
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
    this.finish();
  }

  onDownstreamFinish() {
    this.finish();
  }
}

export class SinkStage extends Stage {

  constructor(methods = {}) {
    super(methods);
    this.resultPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  finish(result) {
    super.finish();
    this.resolve(result);
  }

  error(e) {
    this.reject(e);
  }

  getResult() {
    return this.resultPromise;
  }

  wireOutput(output) {
    throw new Error('Cannot wire output on sink stage');
  }
}