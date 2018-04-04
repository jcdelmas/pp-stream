import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('forEach', () => {
  it('simple', async() => {
    const xs = [];
    await fromArray([1, 2, 3]).runForEach(x => xs.push(x));
    xs.should.be.eql([1, 2, 3]);
  });
});