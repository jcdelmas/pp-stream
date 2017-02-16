
import { Stage } from '../core/stage';
import { create, _registerFlow } from '../core/flow';

/**
 * @param {int} size
 * @param {int} duration
 * @returns {Stream}
 *
 * @memberOf Stream#
 * @memberOf Flow
 */
export function groupedWithin(size, duration) {
  return create(() => new GroupedWithin(size, duration));
}

_registerFlow('groupedWithin', groupedWithin);

export class GroupedWithin extends Stage {

  buffer = [];

  constructor(size, duration) {
    super();
    this.size = size;
    this.duration = duration;
  }

  onPush() {
    this.buffer.push(this.grab());
    console.log('onPush');
    console.log(this.buffer);
    if (this.buffer.length >= this.size) {
      console.log('push');
      this.push(this.buffer);
      this.buffer = [];
    } else if (this.isOutputAvailable()) {
      console.log('pull');
      this.pull();
    }
  }

  doStart() {
    console.log('doStart');
    this.interval = setInterval(() => {
      console.log('tick');
      if (this.isOutputAvailable() && this.buffer.length > 0) {
        console.log('push');
        console.log(this.buffer);
        this.push(this.buffer);
        this.buffer = [];
      }
    }, this.duration);
  }

  doFinish() {
    console.log('finish');
    clearInterval(this.interval);
    if (this.buffer.length) {
      console.log('push');
      console.log(this.buffer);
      this.push(this.buffer);
    }
  }
}
