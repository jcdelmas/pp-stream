import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('filter', () => {

  it('filter', async() => {
    const result = await fromArray([1, 2, 3, 4, 5]).filter(x => x > 2).runToArray();
    result.should.be.eql([3, 4, 5]);
  });
});
