
import 'babel-polyfill'
import 'should'
import { single } from '../../src/index'

describe('single', () => {
  it('simple', async() => {
    const result = await single(5).runToArray();
    result.should.be.eql([5]);
  });
});
