"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('filter', () => {

  it('filter', async() => {
    const result = await Source.from([1, 2, 3, 4, 5]).filter(x => x > 2).toArray();
    result.should.be.eql([3, 4, 5]);
  });
});
