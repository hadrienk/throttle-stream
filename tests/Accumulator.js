import {Writable} from 'readable-stream';
import createDebug from 'debug';

const debug = createDebug('throttle-stream');

export default class Accumulator extends Writable {

  constructor(options) {
    super(options);
    this._dest = [];
  }

  getArray() {
    return this._dest;
  }

  _write(chunk, encoding, callback) {
    debug('received', chunk);
    this._dest.push(chunk);
    callback();
  }

  _writev(chunk, encoding, callback) {
    debug('received', chunk);
    this._dest.push(chunk);
    callback();
  }
}
