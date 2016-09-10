"use strict";

import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('scan', () => {
  it('simple', async () => {
    const result = await Source.from([1, 1, 1]).scan((acc, x) => acc + x, 0).toArray();
    result.should.be.eql([1, 2, 3]);
  });
});