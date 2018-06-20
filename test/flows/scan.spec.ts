import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('scan', () => {
  it('simple', async () => {
    const result = await fromArray([1, 1, 1]).scan((acc, x) => acc + x, 0).runToArray();
    result.should.be.eql([1, 2, 3]);
  });
});