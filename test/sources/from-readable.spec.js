
import 'babel-polyfill'
import 'should'
import fs from 'fs'
import { fromPausedReadable } from '../../src/index'

describe('fromPausedReadable', () => {
  it('fromFile', async() => {
    const readable = fs.createReadStream(__dirname + '/../resources/test.txt', {
      flags: 'r',
      encoding: 'UTF-8',
      autoClose: true
    });
    const result = await fromPausedReadable(readable).runToArray();
    result.should.be.eql(["foo\nbar\nbaz\n"]);
  });

  // TODO: Check cancel
  // TODO: Check error
});