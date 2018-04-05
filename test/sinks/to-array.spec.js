import 'babel-polyfill'
import 'should'
import { toArray, fromArray } from '../../src'
import { keepLeft, keepRight } from '../../src/core/keep'

describe('toArray', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).runToArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('with to', async () => {
    const result = await fromArray([1, 2, 3]).toMat(toArray(), keepRight).run()
    result.should.be.eql([1, 2, 3]);
  });
});
