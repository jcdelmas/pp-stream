import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('distinct', () => {
  it('simple', async() => {
    const result = await fromArray([1, 1, 2, 3, 3, 4, 3, 5]).distinct().runToArray();
    expect(result).to.eql([1, 2, 3, 4, 3, 5]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 1, 2, 3, 3, 4, 3, 5]).distinct().take(3).runToArray();
    expect(result).to.eql([1, 2, 3]);
  });
});
