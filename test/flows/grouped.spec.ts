import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('grouped', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 4, 5]).grouped(2).runToArray();
    result.should.be.eql([[1, 2], [3, 4], [5]]);
  });
});
