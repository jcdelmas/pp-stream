import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray, toArray } from '../../src'

describe('toArray', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).runToArray();
    expect(result).to.eql([1, 2, 3]);
  });
  it('with to', async () => {
    const result = await fromArray([1, 2, 3]).to(toArray()).run()
    expect(result).to.eql([1, 2, 3]);
  });
});
