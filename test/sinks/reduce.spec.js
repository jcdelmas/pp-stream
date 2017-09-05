
import 'babel-polyfill';
import 'should';
import { Source, Sink } from '../../src/index';

describe('reduce', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).reduce((acc, x) => x + acc, 0);
    result.should.be.eql(6);
  });

  it('check side effects', async() => {
    const sink = Sink.reduce((acc, x) => x + acc, 0);

    await Source.from([1, 2, 3]).runWith(sink);
    const result = await Source.from([1, 2, 3]).runWith(sink);
    result.should.be.eql(6);
  });
});
