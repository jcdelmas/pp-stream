import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('scan', () => {
  it('simple', async () => {
    const result = await fromArray([1, 1, 1]).scan((acc, x) => acc + x, 0).runToArray();
    expect(result).to.eql([1, 2, 3]);
  });
});