"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('forEach', () => {
  it('simple', async() => {
    const xs = [];
    await Source.from([1, 2, 3]).forEach(x => xs.push(x));
    expect(xs).toEqual([1, 2, 3]);
  });
});