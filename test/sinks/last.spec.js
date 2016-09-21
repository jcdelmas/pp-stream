"use strict";

import 'babel-polyfill';
import { Source, Sink } from '../../src/index';
import { expectPromise } from '../utils';

describe('last', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).runWith(Sink.last());
    expect(result).toEqual(3);
  });
  it('with empty source', async() => {
    await expectPromise(Source.empty().runWith(Sink.last())).toThrowError('No element found');
  });
});
