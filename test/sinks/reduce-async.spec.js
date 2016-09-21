"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';
import { delayed } from '../utils';

describe('reduceAsync', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).reduceAsync((acc, x) => delayed(20, x + acc), 0);
    expect(result).toEqual(6);
  });
});
