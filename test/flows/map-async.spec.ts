import 'babel-polyfill'
import { expect } from 'chai'
import { delayed, timeChecker, withTime } from '../utils'
import { fromArray } from '../../src'

describe('mapAsync', () => {
  it('simple', async() => {
    const result = await fromArray  ([1, 2, 3]).mapAsync(x => delayed(100, x)).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 200],
      [3, 300]
    ]);
  });
  it('check order', async() => {
    const result = await fromArray([3, 1, 2]).mapAsync(x => delayed((x - 1) * 100, x)).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 200],
      [1, 200],
      [2, 300]
    ]);
  });
  it('check order with parallelism', async() => {
    const result = await fromArray([3, 1, 2]).mapAsync(x => delayed(x * 100, x), 2).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 300],
      [1, 300],
      [2, 500]
    ]);
  });
  it('check parallelism', async() => {
    const result = await fromArray([1, 2, 3, 4]).mapAsync(x => delayed(x * 100, x), 2).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 200],
      [3, 400],
      [4, 600]
    ]);
  });
  it('check parallelism - 2', async() => {
    const result = await fromArray([1, 2, 3, 4]).mapAsync(x => delayed(x * 100, x), 3).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 200],
      [3, 300],
      [4, 500]
    ]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 2, 3, 4]).mapAsync(x => delayed(100, x), 2).take(3).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 100],
      [3, 200]
    ]);
  });
  it('with error', async() => {
    try {
      await fromArray([1, 2, 3]).mapAsync(() => Promise.reject('my error')).runIgnore();
      throw new Error('should have failed');
    } catch (e) {
      expect(e).to.eql('my error');
    }
  });
});

describe('mapAsyncUnordered', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3]).mapAsyncUnordered(x => delayed(100, x)).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 200],
      [3, 300]
    ]);
  });
  it('check order when parallelism is 1', async() => {
    const result = await fromArray([3, 1, 2]).mapAsyncUnordered(x => delayed((x - 1) * 100, x)).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 200],
      [1, 200],
      [2, 300]
    ]);
  });
  it('check unordered with parallelism > 1', async() => {
    const result = await fromArray([2, 1, 3]).mapAsyncUnordered(x => delayed(x * 100, x), 2).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [2, 200],
      [3, 400]
    ]);
  });
  it('check parallelism', async() => {
    const result = await fromArray([4, 3, 2, 3]).mapAsyncUnordered(x => delayed(x * 100, x), 2).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 300],
      [4, 400],
      [2, 500],
      [3, 700]
    ]);
  });
  it('check parallelism - 2', async() => {
    const result = await fromArray([4, 3, 1, 1]).mapAsyncUnordered(x => delayed(x * 100, x), 3).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [1, 200],
      [3, 300],
      [4, 400]
    ]);
  });
  it('with cancel', async() => {
    const result = await fromArray([4, 3, 1, 1]).mapAsyncUnordered(x => delayed(x * 100, x), 3).take(3).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 100],
      [1, 200],
      [3, 300]
    ]);
  });
});
