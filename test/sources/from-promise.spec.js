"use strict";

import "babel-polyfill";
import { Source } from "../../src/index";
import { delayed, expectPromise } from '../utils';

describe('fromPromise', () => {
  it('simple', async () => {
    const result = await Source.fromPromise(delayed(100, 10)).toArray();
    expect(result).toEqual([10]);
  });
  it('direct', async () => {
    const result = await Source.fromPromise(Promise.resolve(5)).toArray();
    expect(result).toEqual([5]);
  });
  it('with error', async () => {
    const promise = Source.fromPromise(Promise.reject('Rejected')).toArray();
    await expectPromise(promise).toThrowError('Rejected');
  });
});