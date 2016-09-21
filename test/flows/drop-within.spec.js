"use strict";

import 'babel-polyfill';

import { TimedSource } from '../utils';

describe('takeWithin', () => {
  it('simple', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [200, 3],
      [50, 4]
    ]).dropWithin(200).toArray();
    expect(result).toEqual([3, 4]) ;
  });
  it('with complete', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3]
    ]).dropWithin(300).toArray();
    expect(result).toEqual([]) ;
  });
});