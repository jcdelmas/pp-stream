
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('head', () => {
  it('simple', async () => {
    const result = await Source.from(['foo', 'bar', 'baz']).runHead();
    result.should.be.eql('foo');
  });

  it('check cancel', async () => {
    const log = [];
    await Source.from(['foo', 'bar', 'baz']).map(x => {
      log.push(x);
      return x;
    }).runHead();
    log.should.be.eql(['foo']);
  });
});