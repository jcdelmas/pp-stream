import _ from 'lodash';
import Sink from './sink';
import Module from './module';

export default class Stream {

  static fromSourceStageFactory(stageFactory) {
    return new Stream(() => {
      const stage = stageFactory();
      return new Module([], [stage], []);
    });
  }

  static fromFlowStageFactory(stageFactory) {
    return new Stream(() => {
      const stage = stageFactory();
      return new Module([stage], [stage], []);
    });
  }

  static fromSinkStageFactory(stageFactory) {
    return new Stream(() => {
      const stage = stageFactory();
      return new Module([stage], [], [stage]);
    });
  }

  static groupStreams(streams) {
    return new Stream(() => Module.group(streams.map(s => s._materialize())));
  }

  static fromGraphBuilder(factory) {
    return new Stream(() => {
      const sinks = [];
      const { inputs = [], outputs = [] } = factory({
        add: s => {
          const module = s._materialize();
          module._sinks.forEach(s => sinks.push(s));
          return module.wrapper();
        }
      });
      return new Module(
        inputs.map(i => i._input),
        outputs.map(o => o._output),
        sinks
      );
    });
  }

  /**
   *
   * @param {function} materializer
   */
  constructor(materializer) {
    this._materialize = materializer;
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  pipe(stream) {
    return Stream.fromGraphBuilder(b => {
      const prev = b.add(this);
      const next = b.add(stream);
      prev.out().wire(next.in());
      return {
        inputs: prev.inputs(),
        outputs: next.outputs()
      };
    });
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  fanIn(stream) {
    return Stream.fromGraphBuilder(b => {
      const prev = b.add(this);
      const fanIn = b.add(stream);

      prev.outputs().forEach(out => out.wire(fanIn.in()));
      return {
        inputs: prev.inputs(),
        outputs: fanIn.outputs()
      };
    });
  }

  /**
   *
   * @param {...Stream} streams
   * @return {Stream}
   */
  fanOut(...streams) {
    return Stream.fromGraphBuilder(b => {
      const prev = b.add(this);
      const outputs = [];
      streams.forEach(stream => {
        const s = b.add(stream);
        prev.out().wire(s.in());
        s.outputs().forEach(o => outputs.push(o));
      });
      return {
        inputs: prev.inputs(),
        outputs
      }
    });
  }

  // Source methods

  /**
   * @param {Stream} sink
   */
  runWith(sink) {
    return this.pipe(sink).run();
  }

  /**
   * @param {SinkStage} sinkStage
   */
  runWithLastStage(sinkStage) {
    return this.runWith(Sink.create(() => sinkStage));
  }

  // Closed graph methods

  /**
   * @returns {Promise}
   */
  run() {
    const promises = this._materialize().run();

    if (promises.length > 1) {
      return Promise.all(promises);
    } else {
      return promises[0];
    }
  }
}
