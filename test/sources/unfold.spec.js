
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('unfold', () => {
  it('simple', async () => {
    const result = await Source.unfold(s => {
      if (s <= 5) {
        return [s + 1, 'a' + s];
      }
    }, 1).toArray();
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
  it('with cancel', async () => {
    const result = await Source.unfold(s => [s + 1, 'a' + s], 1).take(5).toArray();
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5']);
  });
});
