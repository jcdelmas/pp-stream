"use strict";

import 'babel-polyfill';
import { Source, Sink } from '../../src/index';
import { expectPromise } from '../utils';

describe('head', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).runWith(Sink.head());
    expect(result).toEqual(1);
  });
  it('with single', async () => {
    const result = await Source.single('Hello').runWith(Sink.head());
    expect(result).toEqual('Hello');
  });
  it('with infinite source', async() => {
    const result = await Source.repeat('Hello').runWith(Sink.head());
    expect(result).toEqual('Hello');
  });
  it('with empty source', async() => {
    await expectPromise(Source.empty().runWith(Sink.head())).toThrowError(new Error('No element found'));
  });
});
