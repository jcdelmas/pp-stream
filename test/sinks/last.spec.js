
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('last', () => {
  it('simple', async () => {
    const result = await Source.from(['foo', 'bar', 'baz']).last();
    result.should.be.eql('baz');
  });
});
