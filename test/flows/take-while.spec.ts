import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('takeWhile', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 4]).takeWhile(x => x < 3).runToArray();
    result.should.be.eql([1, 2]);
  });
  it('full completion', async() => {
    const result = await fromArray([1, 2]).takeWhile(x => x < 3).runToArray();
    result.should.be.eql([1, 2]);
  });
});
