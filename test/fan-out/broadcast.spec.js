
import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow,
  FanOut,
  Sink
} from '../../src/index';

describe('broadcast', () => {
  it('with sources', async() => {
    const result = await Source.from([1, 2, 3]).broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray().key('first')),
      Flow.map(x => x + 2).pipe(Sink.toArray().key('second'))
    ).run();
    const firstResult = await result.first;
    const secondResult = await result.second;
    firstResult.should.be.eql([2, 3, 4]);
    secondResult.should.be.eql([3, 4, 5]);
  });
  it('with early cancel', async() => {
    const result = Source.from([1, 2, 3]).broadcast(
      Flow.take(2).pipe(Sink.toArray().key('first')),
      Flow.map(x => x + 1).pipe(Sink.toArray().key('second'))
    ).run();
    const firstResult = await result.first;
    const secondResult = await result.second;
    firstResult.should.be.eql([1, 2]);
    secondResult.should.be.eql([2, 3, 4]);
  });
  it('with flow', async() => {
    const sink = Flow.map(x => x + 1).broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray().key('first')),
      Flow.map(x => x + 2).pipe(Sink.toArray().key('second'))
    );
    const result = Source.from([1, 2, 3]).runWith(sink);
    const firstResult = await result.first;
    const secondResult = await result.second;
    firstResult.should.be.eql([3, 4, 5]);
    secondResult.should.be.eql([4, 5, 6]);
  });
  it('with sink', async() => {
    const sink = Sink.broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray().key('first')),
      Flow.map(x => x + 2).pipe(Sink.toArray().key('second'))
    );
    const result = Source.from([1, 2, 3]).map(x => x + 1).runWith(sink);
    const firstResult = await result.first;
    const secondResult = await result.second;
    firstResult.should.be.eql([3, 4, 5]);
    secondResult.should.be.eql([4, 5, 6]);
  });
});
