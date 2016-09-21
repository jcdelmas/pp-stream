"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('reduce', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).reduce((acc, x) => x + acc, 0);
    expect(result).toEqual(6);
  });
});
