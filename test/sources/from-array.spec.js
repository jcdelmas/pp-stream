"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('from array', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).toArray();
    result.should.be.eql([1, 2, 3]);
  });

  it('no side effects', async() => {
    const src = Source.from([1, 2, 3]);
    const result1 = await src.toArray();
    const result2 = await src.toArray();
    result1.should.be.eql([1, 2, 3]);
    result1.should.be.eql(result2);
  });
});
