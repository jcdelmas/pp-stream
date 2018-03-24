
import 'babel-polyfill'
import { expect } from 'chai'
import { emptySource } from '../../src/index'

describe('empty', () => {
  it('simple', async () => {
    const result = await emptySource.runToArray();
    expect(result).to.eql([]);
  });
});