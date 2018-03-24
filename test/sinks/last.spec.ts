import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('last', () => {
  it('simple', async () => {
    const result = await fromArray(['foo', 'bar', 'baz']).runLast();
    expect(result).to.eql('baz');
  });
});
