"use strict";

import 'babel-polyfill';

import { Source } from '../../src/index';
import { TimedSource, TimedSink } from '../utils';

describe('groupedWithin', () => {
  // it('simple - with time limit', async() => {
  //   const result = await TimedSource.of([
  //     [100, 1],
  //     [100, 2],
  //     [200, 3],
  //     [100, 4],
  //     [200, 5]
  //   ]).groupedWithin(3, 300).toArray();
  //   expect(result).toEqual([[1, 2], [3, 4], [5]]);
  // });
  // it('simple - with size limit', async() => {
  //   const result = await TimedSource.of([
  //     [100, 1],
  //     [100, 2],
  //     [100, 3],
  //     [100, 4],
  //     [100, 5]
  //   ]).groupedWithin(2, 500).toArray();
  //   expect(result).toEqual([[1, 2], [3, 4], [5]]);
  // });
  // it('with cancel', async () => {
  //   const result = await TimedSource.of([
  //     [100, 1],
  //     [100, 2],
  //     [200, 3],
  //     [100, 4],
  //     [200, 5]
  //   ]).groupedWithin(3, 300).take(2).toArray();
  //   expect(result).toEqual([[1, 2], [3, 4]]);
  // });
  it('with back pressure', async () => {
    const result = await TimedSource.of([
      [100, 1],
      [100, 2],
      [200, 3],
      [100, 4],
      [200, 5],
      [300, 6]
    ]).groupedWithin(5, 300).runWith(TimedSink.of([0, 400, 0]));
    expect(result).toEqual([[1, 2], [3, 4, 5], [6]]);
  });
});
