import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('map', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3]).map(x => x + 1).runToArray();
    expect(result).to.eql([2, 3, 4]);
  });
});
