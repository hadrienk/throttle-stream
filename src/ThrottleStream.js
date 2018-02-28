import {PassThrough} from 'readable-stream';
import createDebug from 'debug';

const debug = createDebug("throttle-stream");

export default class ThrottleStream extends PassThrough {

  /**
   * Create a new Throttle stream.
   *
   * The stream will delay writes until a certain amount of time has elapsed
   * or the highWaterMark has been reached.
   *
   * The writes will also be stopped according to the back-pressure of the streams
   * it is connected to.
   *
   *
   */
  constructor(options) {
    super(options);
    if (options && options.delay) {
      this.delay = options && options.delay;
      this.timeout = Date.now() + this.delay;
      this.interval = setInterval(() => {
        if (this.hasExpired()) {
          debug('timed out');
          this.uncorkAndIncreaseTimeout();
        }
      }, this.delay);
    }
    this.uncorked = true;
    this.on('drain', () => debug("drain"));
  }

  hasExpired() {
    const now = Date.now();
    return this.timeout < now;
  }

  uncorkAndIncreaseTimeout() {
    this.uncorked = true;
    this.timeout = Date.now() + this.delay;
    debug('uncork. next timeout %s', this.timeout);
    this.uncork();
  }

  _final(callback) {
    clearInterval(this.interval);
    callback();
  }

  write(chunk, encoding, cb) {
    if (this.uncorked) {
      debug('cork');
      this.cork();
      this.uncorked = false;
    }

    const proceed = super.write(chunk, encoding, cb);
    const expired = this.hasExpired();
    if (!proceed || expired) {
      debug('back pressure: %s, timeout %s', proceed, expired);
      process.nextTick(() => {
        this.uncorkAndIncreaseTimeout();
      });
      return false;
    } else {
      return true;
    }
  }

}
