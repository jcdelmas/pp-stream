import 'babel-polyfill'
import { expect } from 'chai'
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
      expect(e).to.eql('my error');
    }
    expect(log).to.eql([1]);
  });
});
