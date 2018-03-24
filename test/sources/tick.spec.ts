import 'babel-polyfill'
import { tick } from '../../src/index'
import { timeChecker, withTime } from '../utils'

describe('tick', () => {
  it('simple', async () => {
    const result = await tick(100, 1).pipe(withTime()).take(5).runToArray();
    timeChecker(result, [
      [1, 100],
      [1, 200],
      [1, 300],
      [1, 400],
      [1, 500]
    ]);
  });
});
