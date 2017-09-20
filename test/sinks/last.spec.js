
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('last', () => {
  it('simple', async () => {
    const result = await Source.from(['foo', 'bar', 'baz']).runLast();
    result.should.be.eql('baz');
  });
});