
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';
import {
  WithTime,
  timeChecker
} from '../utils';

describe('tick', () => {
  it('simple', async () => {
    const result = await Source.tick(100, 1).pipe(WithTime).take(5).toArray();
    timeChecker(result, [
      [1, 100],
      [1, 200],
      [1, 300],
      [1, 400],
      [1, 500]
    ]);
  });
});
