"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';
import { delayed } from '../utils';

describe('reduceAsync', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).reduceAsync((acc, x) => delayed(20, x + acc), 0);
    result.should.be.eql(6);
  });
});
