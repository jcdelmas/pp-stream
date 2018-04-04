import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('drop', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 4]).drop(2).runToArray();
    result.should.be.eql([3, 4]);
  });
  it('with early complete', async() => {
    const result = await fromArray([1, 2]).drop(4).runToArray();
    result.should.be.eql([]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 2, 3, 4]).drop(2).take(1).runToArray();
    result.should.be.eql([3]);
  });
});
