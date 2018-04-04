
import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('from array', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).runToArray();
    result.should.be.eql([1, 2, 3]);
  });

  it('no side effects', async() => {
    const src = fromArray([1, 2, 3]);
    const result1 = await src.runToArray();
    const result2 = await src.runToArray();
    result1.should.be.eql([1, 2, 3]);
    result1.should.be.eql(result2);
  });
});
