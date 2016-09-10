"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('drop', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 4]).drop(2).toArray();
    result.should.be.eql([3, 4]);
  });
  it('with early complete', async() => {
    const result = await Source.from([1, 2]).drop(4).toArray();
    result.should.be.eql([]);
  });
  it('with cancel', async() => {
    const result = await Source.from([1, 2, 3, 4]).drop(2).take(1).toArray();
    result.should.be.eql([3]);
  });
});
