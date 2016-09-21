"use strict";

import 'babel-polyfill';

import { TimedSource } from '../utils';

describe('takeWithin', () => {
  it('simple', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [200, 3]
    ]).takeWithin(200).toArray();
    expect(result).toEqual([1, 2]) ;
  });
  it('with complete', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3]
    ]).takeWithin(300).toArray();
    expect(result).toEqual([1, 2, 3]) ;
  });
  it('with cancel', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3]
    ]).takeWithin(300).take(2).toArray();
    expect(result).toEqual([1, 2]) ;
  });
});