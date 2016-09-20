"use strict";

import 'babel-polyfill';
import 'should';
import { Source, Sink } from '../../src/index';

describe('head', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).runWith(Sink.head());
    result.should.be.eql(1);
  });
  it('with infinite source', async() => {
    const result = await Source.repeat('Hello').runWith(Sink.head());
    result.should.be.eql('Hello');
  });
  it('with empty source', async() => {
    Source.empty().runWith(Sink.head()).should.be.rejectedWith('No element found');
  });
});
