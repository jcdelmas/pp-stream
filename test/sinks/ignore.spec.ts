import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('ignore', () => {
  it('simple', async () => {
    const log: string[] = []
    await fromArray(['foo', 'bar', 'baz']).map(x => {
      log.push(x)
      return x
    }).runIgnore()
    expect(log).to.eql(['foo', 'bar', 'baz'])
  });
});
