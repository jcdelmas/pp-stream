
import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow,
  FanOut,
  Sink
} from '../../src/index';
import { delayedFlow } from '../utils';

describe('balance', () => {
  const DELAY = 50;
  it('with sources', async() => {
    const result = await Source.from([1, 2, 3, 4]).throttle(10).balance(
      delayedFlow(DELAY).map(x => "A" + x),
      delayedFlow(DELAY).map(x => "B" + x)
    ).mergeStreams().toArray();
    result.should.be.eql(["A1", "B2", "A3", "B4"]);
  });
  it('with early cancel', async() => {
    const result = await Source.from([1, 2, 3, 4]).throttle(10).balance(
      Flow.take(1).pipe(delayedFlow(DELAY)).map(x => "A" + x),
      delayedFlow(DELAY).map(x => "B" + x)
    ).mergeStreams().toArray();
    result.should.be.eql(["A1", "B2", "B3", "B4"]);
  });
  it('with flow', async() => {
    const sink = Flow.map(x => x + 1).balance(
      delayedFlow(DELAY).map(x => "A" + x),
      delayedFlow(DELAY).map(x => "B" + x)
    ).mergeStreams().pipe(Sink.toArray());
    const result = await Source.from([1, 2, 3, 4]).throttle(10).runWith(sink);
    result.should.be.eql(["A2", "B3", "A4", "B5"]);
  });
  it('with sink', async() => {
    const sink = Flow.balance(
      delayedFlow(DELAY).map(x => "A" + x),
      delayedFlow(DELAY).map(x => "B" + x)
    ).mergeStreams().pipe(Sink.toArray());
    const result = await Source.from([1, 2, 3, 4]).throttle(10).runWith(sink);
    result.should.be.eql(["A1", "B2", "A3", "B4"]);
  });
});
