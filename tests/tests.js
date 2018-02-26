import test from 'tape';
import ThrottleStream from '../src/ThrottleStream';

test('should be instantiable', t => {
  const stream = new ThrottleStream();
  t.ok(stream, 'instance is truthy');
  t.end();
});
