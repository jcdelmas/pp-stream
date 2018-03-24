
import 'babel-polyfill';
import { expect } from 'chai';
import { balance, fromArray, merge, mergeSources } from '../../src'
import { TimedSource, delayedFlow } from '../utils';

describe('merge', () => {
  it('simple', async() => {
    const source1 = TimedSource
      .then(0, 1)
      .then(150, 4)
      .then(100, 6)
      .toSource();
    const source2 = TimedSource
      .then(50, 2)
      .then(50, 3)
      .then(100, 5)
      .toSource();
    const result = await mergeSources(source1, source2).runToArray();
    expect(result).to.eql([1, 2, 3, 4, 5, 6]);
  });

  it('balance and merge', async() => {
    const DELAY = 50;
    const workers = [1, 2, 3].map(x => delayedFlow<number>(DELAY * x).map(x => x + 1));

    const result = await fromArray([1, 2, 3, 4, 5, 6])
      .fanOutAndFanIn<number>(balance)<number>(...workers)<number>(merge)
      .runToArray();
    expect(result.sort()).to.eql([2, 3, 4, 5, 6, 7]);
  });
});
