"use strict";

import 'babel-polyfill';

import fs from 'fs';
import { Source } from '../../src/index';

describe('fromPausedReadable', () => {
  it('fromFile', async() => {
    const readable = fs.createReadStream(__dirname + '/../resources/test.txt', {
      flags: 'r',
      encoding: 'UTF-8',
      autoClose: true
    });
    const result = await Source.fromPausedReadable(readable).toArray();
    expect(result).toEqual(["foo\nbar\nbaz\n"]);
  });

  // TODO: Check cancel
  // TODO: Check error
});