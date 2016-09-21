"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';

describe('empty', () => {
  it('simple', async () => {
    const result = await Source.empty().toArray();
    expect(result).toEqual([]);
  });
});