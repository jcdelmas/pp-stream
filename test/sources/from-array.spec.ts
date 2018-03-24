
import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('from array', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).runToArray();
    expect(result).to.eql([1, 2, 3]);
  });

  it('no side effects', async() => {
    const src = fromArray([1, 2, 3]);
    const result1 = await src.runToArray();
    const result2 = await src.runToArray();
    expect(result1).to.eql([1, 2, 3]);
    expect(result1).to.eql(result2);
  });
});
