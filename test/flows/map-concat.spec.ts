import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('mapConcat', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).mapConcat(x => [x, x]).runToArray();
    expect(result).to.eql([1, 1, 2, 2, 3, 3]);
  });
});