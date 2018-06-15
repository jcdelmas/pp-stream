import 'babel-polyfill'
import 'should'
import { concatSources, fromArray, map } from '../../src'

describe('concat', () => {
  it('with sources', async() => {
    const result = await fromArray([1, 2]).concat(fromArray([3, 4])).runToArray();
    result.should.be.eql([1, 2, 3, 4]);
  });
  it('with multiple sources', async() => {
    const result = await concatSources(
      fromArray([1, 2]),
      fromArray([3, 4]),
      fromArray([5, 6])
    ).runToArray()
    result.should.be.eql([1, 2, 3, 4, 5, 6])
  })

  it('with flow', async() => {
    const result = await fromArray([3, 4]).pipe(map((x: number) => x - 2).concat(fromArray([3, 4]))).runToArray();
    result.should.be.eql([1, 2, 3, 4]);
  });
});
