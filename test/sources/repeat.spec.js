"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('repeat', () => {
  it('simple', async() => {
    const result = await Source.repeat(7).take(3).toArray();
    expect(result).toEqual([7, 7, 7]);
  });
});
