"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';

describe('mapConcat', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).mapConcat(x => [x, x]).toArray();
    expect(result).toEqual([1, 1, 2, 2, 3, 3]);
  });
});