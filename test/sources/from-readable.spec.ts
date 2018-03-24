
import 'babel-polyfill'
import { expect } from 'chai'
import { createReadStream } from 'fs'
import { fromPausedReadable } from '../../src/index'

describe('fromPausedReadable', () => {
  it('fromFile', async() => {
    const readable = createReadStream(__dirname + '/../resources/test.txt', {
      flags: 'r',
      encoding: 'UTF-8',
      autoClose: true
    });
    const result = await fromPausedReadable(readable).runToArray();
    expect(result).to.eql(["foo\nbar\nbaz\n"]);
  });

  // TODO: Check cancel
  // TODO: Check error
});