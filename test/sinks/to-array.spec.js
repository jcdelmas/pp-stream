import 'babel-polyfill'
import 'should'
import { fromArray, toArray } from '../../src'

describe('toArray', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).runToArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('with to', async () => {
    const result = await fromArray([1, 2, 3]).to(toArray()).run()
    result.should.be.eql([1, 2, 3]);
  });
});
