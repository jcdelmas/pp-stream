import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('head', () => {
  it('simple', async () => {
    const result = await fromArray(['foo', 'bar', 'baz']).runHead();
    result.should.be.eql('foo');
  });

  it('check cancel', async () => {
    const log = [];
    await fromArray(['foo', 'bar', 'baz']).map(x => {
      log.push(x);
      return x;
    }).runHead();
    log.should.be.eql(['foo']);
  });
});