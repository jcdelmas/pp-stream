
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('distinct', () => {
  it('simple', async() => {
    const result = await Source.from([1, 1, 2, 3, 3, 4, 3, 5]).distinct().toArray();
    result.should.be.eql([1, 2, 3, 4, 3, 5]);
  });
  it('with cancel', async() => {
    const result = await Source.from([1, 1, 2, 3, 3, 4, 3, 5]).distinct().take(3).toArray();
    result.should.be.eql([1, 2, 3]);
  });
});
