
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('single', () => {
  it('simple', async() => {
    const result = await Source.single(5).toArray();
    result.should.be.eql([5]);
  });
});
