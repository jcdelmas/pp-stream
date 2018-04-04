import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('flatMapConcat', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3]).flatMapConcat(i => {
      return fromArray([1, 2, 3].map(j => j * i))
    }).runToArray();
    result.should.be.eql([1, 2, 3, 2, 4, 6, 3, 6, 9]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 2, 3]).flatMapConcat(i => {
      return fromArray([1, 2, 3].map(j => j * i))
    }).take(5).runToArray();
    result.should.be.eql([1, 2, 3, 2, 4]);
  });
});
