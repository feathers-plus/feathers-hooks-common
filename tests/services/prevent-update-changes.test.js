
const { assert } = require('chai');
const { preventUpdateChanges } = require('../../lib/services');

let hookBefore;

const validate = (promise) => () => promise
  .then(() => { throw new Error('Promise did not throw'); })
  .catch((error) => {
    if (error.message.match(/^Field [a-z.]+ may not be changed\. \(preventUpdateChanges\)$/)) return Promise.resolve();
    else throw error;
  });

describe('services preventUpdateChanges', () => {
  describe('allowed for before update', () => {
    beforeEach(() => {
      hookBefore = {
        type: 'before',
        method: 'update',
        params: { provider: 'rest' },
        data: { first: 'John', last: 'Doe' } };
    });

    it('does not throw on before update', () => {
      preventUpdateChanges(() => ({ first: 'John' }), 'first')(hookBefore);
    });

    ['before', 'after'].forEach(type => {
      ['find', 'get', 'create', 'update', 'patch', 'remove'].forEach(method => {
        if (type !== 'before' || method !== 'update') {
          it(`throws on ${type} ${method}`, () => {
            hookBefore.type = type;
            hookBefore.method = method;
            assert.throws(() => preventUpdateChanges(() => ({ first: 'John' }), 'first')(hookBefore));
          });
        }
      });
    });
  });

  describe('uses default getter function', () => {
    beforeEach(() => {
      hookBefore = {
        type: 'before',
        method: 'update',
        params: { provider: 'rest' },
        data: { first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } } };
    });

    it('throw when doing a find with pagination', (done) => {
      hookBefore.service = { find: () => ({ data: [{ first: 'Bill', last: 'Gates' }, { first: 'John', last: 'Doe' }] }) };

      Promise.resolve()
        .then(validate(preventUpdateChanges(undefined, 'first')(hookBefore)))
        .then(() => done())
        // test fails if any function call above didn't throw or an unexpected error occured
        .catch((error) => done(error));
    });

    it('throw when doing a find without pagination', (done) => {
      hookBefore.service = { find: () => [{ first: 'Bill', last: 'Gates' }, { first: 'John', last: 'Doe' }] };

      Promise.resolve()
        .then(validate(preventUpdateChanges(undefined, 'first')(hookBefore)))
        .then(() => done())
        // test fails if any function call above didn't throw or an unexpected error occured
        .catch((error) => done(error));
    });

    it('throw when doing a get', (done) => {
      hookBefore.id = 1;
      hookBefore.service = { get: () => ({ first: 'Bill', last: 'Gates' }) };

      Promise.resolve()
        .then(validate(preventUpdateChanges(undefined, 'first')(hookBefore)))
        .then(() => done())
        // test fails if any function call above didn't throw or an unexpected error occured
        .catch((error) => done(error));
    });
  });

  describe('throws on violation', () => {
    beforeEach(() => {
      hookBefore = {
        type: 'before',
        method: 'update',
        params: { provider: 'rest' },
        data: { first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } } };
    });

    it('does not throw if no restricted fields changed', (done) => {
      Promise.resolve()
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Doe' }), 'first')(hookBefore))
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Jobs' }), 'first')(hookBefore))
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } }), 'a')(hookBefore))
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } }), 'a.b')(hookBefore))
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } }), 'a.c')(hookBefore))
        .then(() => preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: undefined, c: { d: { e: 1 } } } }), 'a.c.d.e')(hookBefore))
        .then(() => done())
        .catch(error => done(error));
    });

    it('throw if restricted fields change', (done) => {
      Promise.resolve()
        .then(validate(preventUpdateChanges(() => ({ first: 'Steve', last: 'Doe' }), 'first')(hookBefore)))
        .then(validate(preventUpdateChanges(() => ({ first: 'Steve', last: 'Jobs' }), 'first')(hookBefore)))
        .then(validate(preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: 1, c: { d: { e: 2 } } } }), 'a')(hookBefore)))
        .then(validate(preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: 1, c: { d: { e: 2 } } } }), 'a.b')(hookBefore)))
        .then(validate(preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: 1, c: { d: { e: 2 } } } }), 'a.c')(hookBefore)))
        .then(validate(preventUpdateChanges(() => ({ first: 'John', last: 'Doe', a: { b: 1, c: { d: { e: 2 } } } }), 'a.c.d.e')(hookBefore)))
        .then(() => done())
        // test fails if any function call above didn't throw or an unexpected error occured
        .catch((error) => done(error));
    });
  });
});
