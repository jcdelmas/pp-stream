
import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow
} from '../../src/index';

describe('zip', () => {
  it('with sources', async() => {
    const result = await Source.from([1, 2]).zip(Source.from([3, 4])).runToArray();
    result.should.be.eql([[1, 3], [2, 4]]);
  });
  it('with multiple sources', async() => {
    const result = await Source.zip(
      Source.from([1, 2]),
      Source.from([3, 4]),
      Source.from([5, 6])
    ).runToArray();
    result.should.be.eql([[1, 3, 5], [2, 4, 6]]);
  });

  it('with flow', async() => {
    const result = await Source.from([1, 2]).pipe(Flow.zip(Source.from([3, 4]))).runToArray();
    result.should.be.eql([[1, 3], [2, 4]]);
  });

  it('with flow 2', async() => {
    const result = await Source.from([3, 4]).pipe(Flow.map(x => x - 2).zip(Source.from([3, 4]))).runToArray();
    result.should.be.eql([[1, 3], [2, 4]]);
  });

  it('with different sizes', async() => {
    const result = await Source.from([1, 2, 3, 4]).zip(Source.from([3, 4])).runToArray();
    result.should.be.eql([[1, 3], [2, 4]]);
  });
});
