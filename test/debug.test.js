if (!global._babelPolyfill) { require('babel-polyfill'); }

import hooksCommon from '../src';

describe('debug', () => {
  it('does not crash', () => {
    const hook = {
      type: 'before',
      method: 'create',
      data: { a: 'a' },
      params: { query: { b: 'b' } },
      result: { c: 'c' }
    };
    hooksCommon.debug('my message')(hook);
  });
});
