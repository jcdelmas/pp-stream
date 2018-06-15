import 'babel-polyfill'
import 'should'
import { fromArray, zipSourcesWith } from '../../src/index'

describe('zipWith', () => {
  it('scatter and gather', async () => {
    const result = await zipSourcesWith(
      fromArray([1, 2, 3]),
      fromArray([4, 4, 4]),
      (x, y) => x + y
    ).runToArray()
    result.should.be.eql([5, 6, 7])
  });
});