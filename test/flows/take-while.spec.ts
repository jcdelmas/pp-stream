import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('takeWhile', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 4]).takeWhile(x => x < 3).runToArray();
    expect(result).to.eql([1, 2]);
  });
  it('full completion', async() => {
    const result = await fromArray([1, 2]).takeWhile(x => x < 3).runToArray();
    expect(result).to.eql([1, 2]);
  });
});
