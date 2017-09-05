
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('head', () => {
  it('simple', async () => {
    const result = await Source.from(['foo', 'bar', 'baz']).head();
    result.should.be.eql('foo');
  });

  it('check cancel', async () => {
    const log = [];
    await Source.from(['foo', 'bar', 'baz']).map(x => {
      log.push(x);
      return x;
    }).head();
    log.should.be.eql(['foo']);
  });
});