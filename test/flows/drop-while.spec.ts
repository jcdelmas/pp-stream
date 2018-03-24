import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('dropWhile', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3, 1]).dropWhile(x => x < 3).runToArray();
    expect(result).to.eql([3, 1]);
  });
  it('with early complete', async() => {
    const result = await fromArray([1, 2]).dropWhile(x => x < 3).runToArray();
    expect(result).to.eql([]);
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 2, 3, 4]).dropWhile(x => x < 3).take(1).runToArray();
    expect(result).to.eql([3]);
  });
});
