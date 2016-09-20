"use strict";

import 'babel-polyfill';
import 'should';
import { Source, Sink } from '../../src/index';

describe('last', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).runWith(Sink.last());
    result.should.be.eql(3);
  });
  it('with empty source', async() => {
    Source.empty().runWith(Sink.last()).should.be.rejectedWith('No element found');
  });
});
