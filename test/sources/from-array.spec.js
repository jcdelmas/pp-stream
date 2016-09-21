"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('from array', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).toArray();
    expect(result).toEqual([1, 2, 3]);
  });

  it('no side effects', async() => {
    const src = Source.from([1, 2, 3]);
    const result1 = await src.toArray();
    const result2 = await src.toArray();
    expect(result1).toEqual([1, 2, 3]);
    expect(result1).toEqual(result2);
  });
});
