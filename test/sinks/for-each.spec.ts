import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('forEach', () => {
  it('simple', async() => {
    const xs: number[] = [];
    await fromArray([1, 2, 3]).runForEach(x => xs.push(x));
    expect(xs).to.eql([1, 2, 3]);
  });
});