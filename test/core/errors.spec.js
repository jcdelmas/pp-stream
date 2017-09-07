
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('errors', () => {
  it('simple', async() => {
    const log = [];
    try {
      await Source.from([1, 2, 3]).map(x => {
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
