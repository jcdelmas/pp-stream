import 'babel-polyfill'
import 'should'
import { fromArray } from '../../src/index'

describe('ignore', () => {
  it('simple', async () => {
    const log: string[] = []
    await fromArray(['foo', 'bar', 'baz']).map(x => {
      log.push(x)
      return x
    }).runIgnore()
    log.should.be.eql(['foo', 'bar', 'baz'])
  });
});
