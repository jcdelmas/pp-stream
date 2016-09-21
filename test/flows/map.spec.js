"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';

describe('map', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).map(x => x + 1).toArray();
    expect(result).toEqual([2, 3, 4]);
  });
});
