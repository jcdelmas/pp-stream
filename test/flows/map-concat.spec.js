"use strict";

import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('mapConcat', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).mapConcat(x => [x, x]).toArray();
    result.should.be.eql([1, 1, 2, 2, 3, 3]);
  });
});