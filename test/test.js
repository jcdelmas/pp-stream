import 'babel-polyfill';
import should from 'should';

import {
  Source,
  Sink,
  Flow
} from '../src/index';

describe('Source', () => {
  it('from(list)', async () => {
    const result = await Source.from([1, 2, 3]).toArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('empty', async () => {
    const result = await Source.empty().toArray();
    result.should.be.eql([]);
  });
  it('single', async () => {
    const result = await Source.single(5).toArray();
    result.should.be.eql([5]);
  });
  it('repeat', async () => {
    const result = await Source.repeat(7).take(3).toArray();
    result.should.be.eql([7, 7, 7]);
  });
  it('forEach', async () => {
    const xs = [];
    await Source.from([1, 2, 3]).forEach(x => xs.push(x));
    xs.should.be.eql([1, 2, 3]);
  });
  it('to', async () => {
    const result = await Source.from([1, 2, 3]).to(Sink.toArray()).run();
    result.should.be.eql([1, 2, 3]);
  });

  it('no side effects', async () => {
    const src = Source.from([1, 2, 3]);
    const result1 = await src.toArray();
    const result2 = await src.toArray();
    result1.should.be.eql([1, 2, 3]);
    result1.should.be.eql(result2);
  });
});

describe('Flow stages', () => {
  it('map', async () => {
    const result = await Source.from([1, 2, 3]).map(x => x + 1).toArray();
    result.should.be.eql([2, 3, 4]);
  });
  it('filter', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).filter(x => x > 2).toArray();
    result.should.be.eql([3, 4, 5]);
  });
  it('scan', async () => {
    const result = await Source.from([1, 1, 1]).scan((acc, x) => acc + x, 0).toArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('mapConcat', async () => {
    const result = await Source.from([1, 2, 3]).mapConcat(x => [x, x]).toArray();
    result.should.be.eql([1, 1, 2, 2, 3, 3]);
  });
  it('grouped', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).grouped(2).toArray();
    result.should.be.eql([[1, 2], [3, 4], [5]]);
  });
  it('sliding', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).sliding(3).toArray();
    result.should.be.eql([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  });
  it('sliding - 2', async () => {
    const result = await Source.from([1, 2, 3, 4]).sliding(3, 2).toArray();
    result.should.be.eql([[1, 2, 3], [3, 4]]);
  });
  it('take - 1', async () => {
    const result = await Source.from([1, 2, 3, 4]).take(2).toArray();
    result.should.be.eql([1, 2]);
  });
  it('take - 2', async () => {
    const result = await Source.from([1, 2]).take(4).toArray();
    result.should.be.eql([1, 2]);
  });
  it('drop - 1', async () => {
    const result = await Source.from([1, 2, 3, 4]).drop(2).toArray();
    result.should.be.eql([3, 4]);
  });
  it('drop - 2', async () => {
    const result = await Source.from([1, 2]).drop(4).toArray();
    result.should.be.eql([]);
  });
});

describe('Fan in stages', () => {
  describe('concat', () => {
    it('with source', async () => {
      const result = await Source.from([1, 2]).concat(Source.from([3, 4])).toArray();
      result.should.be.eql([1, 2, 3, 4]);
    });
    it('with multiple sources', async () => {
      const result = await Source.concat(
        Source.from([1, 2]),
        Source.from([3, 4]),
        Source.from([5, 6])
      ).toArray();
      result.should.be.eql([1, 2, 3, 4, 5, 6]);
    });

    it('with flow', async () => {
      const result = await Source.from([1, 2]).via(Flow.concat(Source.from([3, 4]))).toArray();
      result.should.be.eql([1, 2, 3, 4]);
    });

    it('with flow 2', async () => {
      const result = await Source.from([3, 4]).via(Flow.map(x => x - 2).concat(Source.from([3, 4]))).toArray();
      result.should.be.eql([1, 2, 3, 4]);
    });
  });

  describe('zip', () => {
    it('with source', async () => {
      const result = await Source.from([1, 2]).zip(Source.from([3, 4])).toArray();
      result.should.be.eql([[1, 3], [2, 4]]);
    });
    it('with multiple sources', async () => {
      const result = await Source.zip(
        Source.from([1, 2]),
        Source.from([3, 4]),
        Source.from([5, 6])
      ).toArray();
      result.should.be.eql([[1, 3, 5], [2, 4, 6]]);
    });

    it('with flow', async () => {
      const result = await Source.from([1, 2]).via(Flow.zip(Source.from([3, 4]))).toArray();
      result.should.be.eql([[1, 3], [2, 4]]);
    });

    it('with flow 2', async () => {
      const result = await Source.from([3, 4]).via(Flow.map(x => x - 2).zip(Source.from([3, 4]))).toArray();
      result.should.be.eql([[1, 3], [2, 4]]);
    });

    it('with different sizes', async () => {
      const result = await Source.from([1, 2, 3, 4]).zip(Source.from([3, 4])).toArray();
      result.should.be.eql([[1, 3], [2, 4]]);
    });
  });
});

describe('Fan out stages', () => {
  describe('broadcast', () => {
    it('with source', async () => {
      const result = await Source.from([1, 2, 3]).broadcast(
        Flow.map(x => x + 1).to(Sink.toArray()),
        Flow.map(x => x + 2).to(Sink.toArray())
      ).run();
      result.should.be.eql([[2, 3, 4], [3, 4, 5]]);
    });
    it('with early cancel', async () => {
      const result = await Source.from([1, 2, 3]).broadcast(
        Flow.take(2).to(Sink.toArray()),
        Flow.map(x => x + 1).to(Sink.toArray())
      ).run();
      result.should.be.eql([[1, 2], [2, 3, 4]]);
    });
    it('with flow', async () => {
      const sink = Flow.map(x => x + 1).broadcast(
        Flow.map(x => x + 1).to(Sink.toArray()),
        Flow.map(x => x + 2).to(Sink.toArray())
      );
      const result = await Source.from([1, 2, 3]).runWith(sink);
      result.should.be.eql([[3, 4, 5], [4, 5, 6]]);
    });
    it('with sink', async () => {
      const sink = Sink.broadcast(
        Flow.map(x => x + 1).to(Sink.toArray()),
        Flow.map(x => x + 2).to(Sink.toArray())
      );
      const result = await Source.from([1, 2, 3]).map(x => x + 1).runWith(sink);
      result.should.be.eql([[3, 4, 5], [4, 5, 6]]);
    });
  });

  describe('balance', () => {
    const DELAY = 50;
    it('with source', async () => {
      const result = await Source.from([1, 2, 3, 4]).balance(
        Flow.delay(DELAY).to(Sink.toArray()),
        Flow.delay(DELAY).to(Sink.toArray())
      ).run();
      result.should.be.eql([[1, 3], [2, 4]]);
    });
    it('with early cancel', async () => {
      const result = await Source.from([1, 2, 3, 4]).balance(
        Flow.take(1).delay(DELAY).to(Sink.toArray()),
        Flow.delay(DELAY).to(Sink.toArray())
      ).run();
      result.should.be.eql([[1], [2, 3, 4]]);
    });
    it('with flow', async () => {
      const sink = Flow.map(x => x + 1).balance(
        Flow.delay(DELAY).to(Sink.toArray()),
        Flow.delay(DELAY).to(Sink.toArray())
      );
      const result = await Source.from([1, 2, 3, 4]).runWith(sink);
      result.should.be.eql([[2, 4], [3, 5]]);
    });
    it('with sink', async () => {
      const sink = Sink.balance(
        Flow.delay(DELAY).to(Sink.toArray()),
        Flow.delay(DELAY).to(Sink.toArray())
      );
      const result = await Source.from([1, 2, 3, 4]).runWith(sink);
      result.should.be.eql([[1, 3], [2, 4]]);
    });
  });
});

describe('routing', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).via(Flow.map(x => x + 1)).toArray();
    result.should.be.eql([2, 3, 4]);
  });
  it('complex', async () => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .via(Flow.filter(x => x > 2).map(x => x - 1))
      .toArray();
    result.should.be.eql([2, 3, 4]);
  });
  it('with Sink', async () => {
    const result = await Source.from([1, 2, 3])
      .runWith(Flow.map(x => x + 1).to(Sink.toArray()));
    result.should.be.eql([2, 3, 4]);
  });
});

describe('Sink', () => {
  it('fold', async () => {
    const result = await Source.from([1, 2, 3]).reduce((acc, x) => x + acc, 0);
    result.should.be.eql(6);
  });
});
