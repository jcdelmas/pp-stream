"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';

describe('push only sources', () => {
  it('simple case', async() => {
    const result = await Source.createPushOnly({
      doStart() {
        this.push(1);
        this.push(2);
        this.push(3);
        this.pushAndComplete(4);
      }
    }).map(x => x + 1).toArray();
    expect(result).toEqual([2, 3, 4, 5]);
  });
});
