import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('distinct', () => {
  it('simple', async() => {
    const result = await fromArray([1, 1, 2, 3, 3, 4, 3, 5]).distinct().runToArray();
    result.should.be.eql([1, 2, 3, 4, 3, 5]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 1, 2, 3, 3, 4, 3, 5]).distinct().take(3).runToArray();
    result.should.be.eql([1, 2, 3]);
  });
});
