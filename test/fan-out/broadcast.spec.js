"use strict";

import 'babel-polyfill';
import {
  Source,
  Flow,
  FanOut,
  Sink
} from '../../src/index';

describe('broadcast', () => {
  it('with sources', async() => {
    const result = await Source.from([1, 2, 3]).broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray()),
      Flow.map(x => x + 2).pipe(Sink.toArray())
    ).run();
    expect(result).toEqual([[2, 3, 4], [3, 4, 5]]);
  });
  it('with early cancel', async() => {
    const result = await Source.from([1, 2, 3]).broadcast(
      Flow.take(2).pipe(Sink.toArray()),
      Flow.map(x => x + 1).pipe(Sink.toArray())
    ).run();
    expect(result).toEqual([[1, 2], [2, 3, 4]]);
  });
  it('with flow', async() => {
    const sink = Flow.map(x => x + 1).broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray()),
      Flow.map(x => x + 2).pipe(Sink.toArray())
    );
    const result = await Source.from([1, 2, 3]).runWith(sink);
    expect(result).toEqual([[3, 4, 5], [4, 5, 6]]);
  });
  it('with sink', async() => {
    const sink = FanOut.broadcast(
      Flow.map(x => x + 1).pipe(Sink.toArray()),
      Flow.map(x => x + 2).pipe(Sink.toArray())
    );
    const result = await Source.from([1, 2, 3]).map(x => x + 1).runWith(sink);
    expect(result).toEqual([[3, 4, 5], [4, 5, 6]]);
  });
});
