
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';
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
    const result = await Source.merge(source1, source2).toArray();
    result.should.be.eql([1, 2, 3, 4, 5, 6]);
  });

  it('balance and merge', async() => {
    const DELAY = 50;
    const workers = [1, 2, 3].map(x => delayedFlow(DELAY * x).map(x => x + 1));

    const result = await Source.from([1, 2, 3, 4, 5, 6])
      .balance(...workers)
      .mergeStreams()
      .toArray();
    result.sort().should.be.eql([2, 3, 4, 5, 6, 7]);
  });
});
