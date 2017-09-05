
import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow,
  OverflowStrategy
} from '../../src/index';

describe('interleave', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).interleave(Source.from([4, 5, 6, 7, 8])).toArray();
    result.should.be.eql([1, 4, 2, 5, 3, 6, 7, 8]);
  });
  it('with segment size > 1', async() => {
    const result = await Source.from([1, 2, 3]).interleave(Source.from([4, 5, 6, 7, 8]), 2).toArray();
    result.should.be.eql([1, 2, 4, 5, 3, 6, 7, 8]);
  });
  it('with cancel', async() => {
    const result = await Source.from([1, 2, 3]).interleave(Source.from([4, 5, 6, 7, 8])).take(6).toArray();
    result.should.be.eql([1, 4, 2, 5, 3, 6]);
  });
  it('with more than 2 sources', async() => {
    const result = await Source.interleave([
      Source.from([1, 2, 3]),
      Source.from([4, 5, 6]),
      Source.from([7, 8, 9])
    ]).toArray();
    result.should.be.eql([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });
  it('with broadcast', async() => {
    const result = await Source.from([1, 2, 3]).broadcast(
      Flow.map(x => x).buffer(1, OverflowStrategy.BACK_PRESSURE),
      Flow.map(x => x * 2).buffer(1, OverflowStrategy.BACK_PRESSURE),
      Flow.map(x => x * 3).buffer(1, OverflowStrategy.BACK_PRESSURE)
    ).interleaveStreams().toArray();
    result.should.be.eql([1, 2, 3, 2, 4, 6, 3, 6, 9]);
  });
});
