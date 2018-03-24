import 'babel-polyfill'
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { fromArray, OverflowStrategy } from '../../src/index'
import { timeChecker, TimedSource, withTime } from '../utils'

use(chaiAsPromised)

describe('delay', () => {
  it('simple', async () => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3]
    ]).delay(200).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 200],
      [2, 300],
      [3, 400]
    ]);
  });
  it('drop head', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [300, 4]
    ]).delay(300, 2, OverflowStrategy.DROP_HEAD).pipe(withTime()).runToArray();
    timeChecker(result, [
      [2, 400],
      [3, 500],
      [4, 800]
    ]);
  });
  it('drop tail', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [200, 4]
    ]).delay(300, 2, OverflowStrategy.DROP_TAIL).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 300],
      [3, 500],
      [4, 700]
    ]);
  });
  it('drop new', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [200, 4]
    ]).delay(300, 2, OverflowStrategy.DROP_NEW).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 300],
      [2, 400],
      [4, 700]
    ]);
  });
  it('drop buffer', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [100, 4]
    ]).delay(300, 2, OverflowStrategy.DROP_BUFFER).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 500],
      [4, 600]
    ]);
  });
  it('back pressure', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [100, 4]
    ]).delay(300, 2, OverflowStrategy.BACK_PRESSURE).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 300],
      [2, 400],
      [3, 600],
      [4, 700]
    ]);
  });
  it('fail', async() => {
    const promise = fromArray([1, 2, 3])
      .delay(100, 2, OverflowStrategy.FAIL)
      .runToArray()
    await expect(promise).to.be.rejectedWith('Buffer overflow')
  });
  it('with cancel', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3]
    ]).delay(300).take(2).pipe(withTime()).runToArray();
    timeChecker(result, [
      [1, 300],
      [2, 400]
    ]);
  });
});

describe('debounce', () => {
  it('simple', async() => {
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [100, 3],
      [400, 4],
    ]).debounce(300).pipe(withTime()).runToArray();
    timeChecker(result, [
      [3, 500],
      [4, 900]
    ]);
  });
});
