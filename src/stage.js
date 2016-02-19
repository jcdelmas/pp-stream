import { EventEmitter } from 'events';

export default class Stage {

  events = new EventEmitter();

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

  push(x) {
    setImmediate(() => {
      try {
        this.output.onPush(x);
      } catch (e) {
        this.error(e);
      }
    });
  }

  pull() {
    this.input.onPull();
  }

  error(e) {
    setImmediate(() => {
      if (this.output) {
        this.output.onError(e);
      } else {
        this.events.emit('error', e);
      }
    });
  }

  finish(result) {
    this.finished = true;
    setImmediate(() => {
      this.events.emit('finish', result);
      if (this.input && !this.input.finished) {
        this.input.onDownstreamFinish();
      }
      if (this.output && !this.output.finished) {
        this.output.onUpstreamFinish();
      }
    });
  }

  getResult() {
    return new Promise((resolve, reject) => {
      this.events.on('finish', resolve);
      this.events.on('error', reject);
    });
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