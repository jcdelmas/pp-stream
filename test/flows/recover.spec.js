"use strict";

import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('recover', () => {
  it('without message', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error();
      }
      return x;
    }).recover().toArray();
    result.should.be.eql([1, 3, 5]);
  });

  it('with message', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error();
      }
      return x;
    }).recover(() => 'error').toArray();
    result.should.be.eql([1, 'error', 3, 'error', 5]);
  });

  it('with rethrow', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).map(x => {
      if (x % 2 === 0) {
        throw new Error('error' + x);
      }
      return x;
    }).recover(err => {
      if (err.message === 'error2') {
        return 'first';
      }
      throw e;
    }).recover(() => 'second').toArray();
    result.should.be.eql([1, 'first', 3, 'second', 5]);
  });
});