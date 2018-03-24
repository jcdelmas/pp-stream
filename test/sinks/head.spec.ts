import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('head', () => {
  it('simple', async () => {
    const result = await fromArray(['foo', 'bar', 'baz']).runHead();
    expect(result).to.eql('foo');
  });

  it('check cancel', async () => {
    const log: string[] = [];
    await fromArray(['foo', 'bar', 'baz']).map(x => {
      log.push(x);
      return x;
    }).runHead();
    expect(log).to.eql(['foo']);
  });
});