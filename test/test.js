var $ = require('./index');

new $.ListStream([3, 2, 6, 1, 5]).map(function(i) {
  return i + 1;
}).filter(function(i) {
  return i > 5;
}).pipe(new $.Pipe()).each(function(item) {
  console.log(item);
});

new $.ListStream([3, 2, 6, 1, 5]).pipe(new $.Pipe().map(function(i) {
  return i + 1;
}).filter(function(i) {
  return i > 5;
})).each(function(item) {
  console.log(item);
});
