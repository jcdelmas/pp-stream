var $ = require('./index');

var stream = new $.ListStream([3, 2, 6, 1, 5]);

stream.map(function(i) {
  return i + 1;
}).filter(function(i) {
  return i > 5;
}).each(function(item) {
  console.log(item);
});
