"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('empty', () => {
  it('simple', async () => {
    const result = await Source.empty().toArray();
    result.should.be.eql([]);
  });
});