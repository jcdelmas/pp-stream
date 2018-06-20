import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('last', () => {
  it('simple', async () => {
    const result = await fromArray(['foo', 'bar', 'baz']).runLast();
    result.should.be.eql('baz');
  });
});
