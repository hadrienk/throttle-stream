import test from 'tape';
import ThrottleStream from '../src/ThrottleStream';
import {Duplex, PassThrough} from 'readable-stream';
import CountDown from './CountDown';
import Accumulator from './Accumulator';

test('should be instantiable', t => {
  const stream = new ThrottleStream();
  t.ok(stream, 'instance is truthy');
  t.ok(stream instanceof Duplex, 'extends Duplex');
  t.end();
});

test('should produce the data it receives', t => {
  const countDown = new CountDown({count: 100, objectMode: true});
  const throttle = new ThrottleStream({objectMode: true, highWaterMark: 16, delay: 100});
  const accumulator = new Accumulator({objectMode: true});
  countDown.pipe(throttle).pipe(accumulator);

  countDown.on('end', () => {
    const content = accumulator.getArray();
    t.ok(content.length === 100, 'all the points arrived');
    t.end();
  });
});

test('should not send data until timeout', t => {
  const reader = new PassThrough({ objectMode: true });
  const throttle = new ThrottleStream({objectMode: true, highWaterMark: 8, delay: 100});
  const accumulator = new Accumulator({objectMode: true});
  reader.pipe(throttle).pipe(accumulator);

  const expected = [1,2,3,4];
  reader.push(expected[0]);
  reader.push(expected[1]);
  reader.push(expected[2]);
  reader.push(expected[3]);

  t.ok(accumulator.getArray().length === 0, 'no data before time out');
  setTimeout(() => {
    const result = accumulator.getArray();
    t.deepLooseEqual(result, expected, 'data after time out');
    reader.push(null);
    t.end();
  }, 100);
});

test('should not send data until highWaterMark is reached', t => {

  const reader = new PassThrough({ objectMode: true });
  const throttle = new ThrottleStream({objectMode: true, highWaterMark: 4, delay: 1000});
  const accumulator = new Accumulator({objectMode: true});
  reader.pipe(throttle).pipe(accumulator);

  const expected = [1,2,3,4];

  reader.push(expected[0]);
  reader.push(expected[1]);
  reader.push(expected[2]);
  t.ok(accumulator.getArray().length === 0, 'no data before highWaterMark');
  reader.push(expected[3]);

  setImmediate(() => {
    const result = accumulator.getArray();
    t.deepLooseEqual(result, expected, 'data after time out');
    reader.push(null);
    t.end();
  });
});


