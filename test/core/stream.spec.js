"use strict";

import 'babel-polyfill';
import {
  Source,
  Flow,
  Sink
} from '../../src/index';

describe('routing', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).pipe(Flow.map(x => x + 1)).toArray();
    expect(result).toEqual([2, 3, 4]);
  });
  it('complex', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .pipe(Flow.filter(x => x > 2).map(x => x - 1))
      .toArray();
    expect(result).toEqual([2, 3, 4]);
  });
  it('with Sink', async() => {
    const result = await Source.from([1, 2, 3])
      .runWith(Flow.map(x => x + 1).pipe(Sink.toArray()));
    expect(result).toEqual([2, 3, 4]);
  });
});
