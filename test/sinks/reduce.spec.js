"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('reduce', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).reduce((acc, x) => x + acc, 0);
    result.should.be.eql(6);
  });
});
