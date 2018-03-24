
import 'babel-polyfill'
import { expect } from 'chai'
import { single } from '../../src/index'

describe('single', () => {
  it('simple', async() => {
    const result = await single(5).runToArray();
    expect(result).to.eql([5]);
  });
});
