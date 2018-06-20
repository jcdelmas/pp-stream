import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('mapConcat', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).mapConcat(x => [x, x]).runToArray();
    result.should.be.eql([1, 1, 2, 2, 3, 3]);
  });
});