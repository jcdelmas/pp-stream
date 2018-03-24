import 'babel-polyfill'
import { expect } from 'chai'
import { reduce, fromArray } from '../../src/index'

describe('reduce', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3]).runReduce((acc, x) => x + acc, 0);
    expect(result).to.eql(6);
  });

  it('check side effects', async() => {
    const sink = reduce((acc: number, x: number) => x + acc, 0);

    await fromArray([1, 2, 3]).runWith(sink);
    const result = await fromArray([1, 2, 3]).runWith(sink);
    expect(result).to.eql(6);
  });
});
