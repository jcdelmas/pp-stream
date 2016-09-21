"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';

describe('takeWhile', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 4]).takeWhile(x => x < 3).toArray();
    expect(result).toEqual([1, 2]);
  });
  it('full completion', async() => {
    const result = await Source.from([1, 2]).takeWhile(x => x < 3).toArray();
    expect(result).toEqual([1, 2]);
  });
});
