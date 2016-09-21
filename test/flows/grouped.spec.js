"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';

describe('grouped', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 4, 5]).grouped(2).toArray();
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});
