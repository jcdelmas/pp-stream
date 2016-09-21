"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';
import { delayed, expectPromise } from '../utils';

describe('unfoldAsync', () => {
  it('simple', async () => {
    const result = await Source.unfoldAsync(s => delayed(10, s <= 5 ? [s + 1, 'a' + s] : null), 1).toArray();
    expect(result).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
  it('with cancel', async () => {
    const result = await Source.unfoldAsync(s => delayed(10, [s + 1, 'a' + s]), 1).take(5).toArray();
    expect(result).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
  it('with error', async () => {
    const promise = Source.unfoldAsync(s => Promise.reject('rejected'), 1).toArray();
    await expectPromise(promise).toThrowError('rejected');
  });
});
