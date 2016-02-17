import {
  Source,
  Flow
} from '../lib/index';

Source.fromList([3, 2, 6, 1, 5])
  .map(i => i + 1)
  .filter(i => i > 5)
  .via(new Flow())
  .each(item => console.log(item))
  .then(() => console.log('done'))
  .catch(e => console.error(e.stack));

Source.fromList([3, 2, 6, 1, 5])
  .via(Flow.map(i => i + 1).filter(i => i > 5))
  .each(item => console.log(item))
  .then(() => console.log('done'))
  .catch(e => console.error(e.stack));
