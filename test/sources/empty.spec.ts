
import 'babel-polyfill'
import 'should'
import { emptySource } from '../../src/index'

describe('empty', () => {
  it('simple', async () => {
    const result = await emptySource.runToArray();
    result.should.be.eql([]);
  });
});