import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('take', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 4]).take(2).runToArray();
    result.should.be.eql([1, 2]);
  });
  it('early complete', async() => {
    const result = await fromArray([1, 2]).take(4).runToArray();
    result.should.be.eql([1, 2]);
  });
});
