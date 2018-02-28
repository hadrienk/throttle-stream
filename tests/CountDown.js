import {Readable} from 'readable-stream';

export default class CountDown extends Readable {

  constructor(options) {
    super(options);
    if (!options.count)
      throw new Error('size must be defined');
    if (!options.count < 0)
      throw new Error('size must be positive');

    this._count = options.count;
  }

  _read(size) {
    while (size-- > 0 && this._count-- > 0)
      if (!this.push(this._count)) return;
    this.push(null);
  }

}
