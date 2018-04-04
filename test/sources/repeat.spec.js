
import 'babel-polyfill'
import 'should'
import { repeat } from '../../src/index'

describe('repeat', () => {
  it('simple', async() => {
    const result = await repeat(7).take(3).runToArray();
    result.should.be.eql([7, 7, 7]);
  });
});
