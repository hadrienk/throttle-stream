import {PassThrough} from 'readable-stream';
import createDebug from 'debug';

const debug = createDebug("throttle-stream");

export default class ThrottleStream extends PassThrough {

  /**
   * Create a new Throttle stream.
   *
   * The stream will wait until a certain amount of time has elapsed
   * or a certain amount of byte/object has gone through it.
   *
   * Note that this stream will respect the back-pressure of the stream it
   * is connected to.
   */
  constructor(options) {
    super(options);
    if (options && options.delay) {
      this.delay = options && options.delay;
      this.timeout = Date.now() + this.delay;
      this.interval = setInterval(() => {
        if (!this.writing && !this.uncorked && this.hasExpired()) {
          debug('timed out');
          this.uncorkAndIncreaseTimeout();
          //process.nextTick(() => this.uncorkAndIncreaseTimeout());
        }
      }, this.delay);
    }

    this.writing = false;
    this.uncorked = true;

  }

  hasExpired() {
    const now = Date.now();
    return this.timeout < now;
  }

  uncorkAndIncreaseTimeout() {
    this.uncorked = true;
    this.timeout = Date.now() + this.delay;
    if (this.writing) {
      this.once('drain', () => {
        debug('uncorked from drain');
        this.uncork();
      });
    } else {
      debug('uncorked from timeout');
      this.uncork();
    }
  }

  _final(callback) {
    clearInterval(this.interval);
    callback();
  }

  write(chunk, encoding, cb) {

    if (this.uncorked) {
      debug('corked');
      this.cork();
      this.uncorked = false;
    }

    this.writing = true;

    const proceed = super.write(chunk, encoding);
    const expired = this.hasExpired();

    debug('write returned %s, hasExpired %s', proceed, expired);

    if (!proceed) {
      process.nextTick(() => {
        this.uncorkAndIncreaseTimeout();
      });
      this.writing = false;
      return false;
    } else {
      this.writing = false;
      return true;
    }
  }

}
