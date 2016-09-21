"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('dropWhile', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 1]).dropWhile(x => x < 3).toArray();
    expect(result).toEqual([3, 1]);
  });
  it('with early complete', async() => {
    const result = await Source.from([1, 2]).dropWhile(x => x < 3).toArray();
    expect(result).toEqual([]);
  });
  it('with cancel', async() => {
    const result = await Source.from([1, 2, 3, 4]).dropWhile(x => x < 3).take(1).toArray();
    expect(result).toEqual([3]);
  });
});
