import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('sliding', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3, 4, 5]).sliding(3).runToArray();
    result.should.be.eql([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  });
  it('with step > 1', async () => {
    const result = await fromArray([1, 2, 3, 4, 5, 6]).sliding(3, 2).runToArray();
    result.should.be.eql([[1, 2, 3], [3, 4, 5], [5, 6]]);
  });
});