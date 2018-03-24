import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray } from '../../src/index'

describe('recover', () => {
  it('without message', async () => {
    const result = await fromArray([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error();
      }
      return x;
    }).recover().runToArray();
    expect(result).to.eql([1, 3, 5]);
  });

  it('with message', async () => {
    const result = await fromArray([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error();
      }
      return x;
    }).recover(() => 0).runToArray();
    expect(result).to.eql([1, 0, 3, 0, 5]);
  });

  it('with rethrow', async () => {
    const result = await fromArray([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error('error' + x);
      }
      return x;
    }).recover(err => {
      if (err.message === 'error2') {
        return -1;
      }
      throw err;
    }).recover(() => -2).runToArray();
    expect(result).to.eql([1, -1, 3, -2, 5]);
  });
});