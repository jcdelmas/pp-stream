
import 'babel-polyfill'
import 'should'
import { unfoldAsync } from '../../src/index'
import { delayed } from '../utils'

describe('unfoldAsync', () => {
  it('simple', async () => {
    const result = await unfoldAsync(s => delayed(10, s <= 5 ? [s + 1, 'a' + s] : null), 1).runToArray();
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
  it('with cancel', async () => {
    const result = await unfoldAsync(s => delayed(10, [s + 1, 'a' + s]), 1).take(5).runToArray();
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
  it('with error', async () => {
    unfoldAsync(s => Promise.reject('rejected'), 1).runToArray().should.be.rejected();
  });
});
