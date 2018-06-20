import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src'

describe('errors', () => {
  it('simple', async() => {
    const log: number[] = [];
    try {
      await fromArray([1, 2, 3]).map(x => {
        log.push(x);
        return x;
      }).mapAsync(() => Promise.reject('my error')).runToArray();
      throw new Error('should have failed');
    } catch (e) {
      e.should.be.eql('my error');
    }
    log.should.be.eql([1]);
  });
});
