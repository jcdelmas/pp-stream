"use strict";

import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow
} from '../../src/index';

describe('concat', () => {
  it('with sources', async() => {
    const result = await Source.from([1, 2]).concat(Source.from([3, 4])).toArray();
    result.should.be.eql([1, 2, 3, 4]);
  });
  it('with multiple sources', async() => {
    const result = await Source.concat(
      Source.from([1, 2]),
      Source.from([3, 4]),
      Source.from([5, 6])
    ).toArray();
    result.should.be.eql([1, 2, 3, 4, 5, 6]);
  });

  it('with flow', async() => {
    const result = await Source.from([1, 2]).pipe(Flow.concat(Source.from([3, 4]))).toArray();
    result.should.be.eql([1, 2, 3, 4]);
  });

  it('with flow 2', async() => {
    const result = await Source.from([3, 4]).pipe(Flow.map(x => x - 2).concat(Source.from([3, 4]))).toArray();
    result.should.be.eql([1, 2, 3, 4]);
  });
});
