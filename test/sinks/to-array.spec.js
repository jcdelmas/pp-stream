"use strict";

import 'babel-polyfill';
import {
  Source,
  Sink
} from '../../src/index';

describe('toArray', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).toArray();
    expect(result).toEqual([1, 2, 3]);
  });
  it('with to', async () => {
    const result = await Source.from([1, 2, 3]).pipe(Sink.toArray()).run();
    expect(result).toEqual([1, 2, 3]);
  });
});
