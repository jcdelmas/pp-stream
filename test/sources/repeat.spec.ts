
import 'babel-polyfill'
import { expect } from 'chai'
import { repeat } from '../../src/index'

describe('repeat', () => {
  it('simple', async() => {
    const result = await repeat(7).take(3).runToArray();
    expect(result).to.eql([7, 7, 7]);
  });
});
