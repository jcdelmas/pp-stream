import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray, zipSourcesWith } from '../../src/index'

describe('zipWith', () => {
  it('scatter and gather', async () => {
    const result = await zipSourcesWith(
      fromArray([1, 2, 3]),
      fromArray([4, 4, 4]),
      (x, y) => x + y
    ).runToArray()
    expect(result).to.eql([5, 6, 7])
  });
});