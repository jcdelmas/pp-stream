import {
  Source,
  Sink,
  Flow
} from '../lib/index';

Source.from([3, 2, 6, 1, 5])
  .map(i => i + 1)
  .filter(i => i > 5)
  .via(Flow.create())
  .forEach(item => console.log(item))
  .then(() => console.log('done'))
  .catch(e => console.error(e.stack));

Source.from([3, 2, 6, 1, 5])
  .runWith(
    Flow.map(i => i + 1)
      .filter(i => i > 5)
      .to(Sink.forEach(item => console.log(item)))
  )
  .then(() => console.log('done'))
  .catch(e => console.error(e.stack));
