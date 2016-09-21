"use strict";

import 'babel-polyfill';
import {
  Source,
  Flow
} from '../../src/index';

describe('zipWith', () => {
  it('scatter and gather', async () => {
    const result = await Source.from([1, 2, 3])
      .broadcast(
        Flow.map(x => x + 1),
        Flow.map(x => x * 2)
      )
      .zipWith((x, y) => x + y)
      .toArray();
    expect(result).toEqual([4, 7, 10]);
  });
});