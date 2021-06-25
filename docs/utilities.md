---
title: Utilities
---

# Utilities

## callingParams

Build `params` for a service call.

- **Arguments**

  - `{Object} options`

| Argument  |   Type   | Default | Description                                                 |
| --------- | :------: | ------- | ----------------------------------------------------------- |
| `options` | `Object` |         | How to construct params for service call.                   |

| `options`        | Argument          | Type | Default                                                                                                                      | Description |
| ---------------- | ----------------- | :--: | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `query`          | `Object`          |      | The `params.query` for the calling params.                                                                                   |
| `propNames`      | `Array< String >` | `[]` | The names of the props in `context.params` to include in the new params.                                                     |
| `newProps`       | `Object`          | `{}` | Additional props to add to the new params.                                                                                   |
| `hooksToDisable` | `Array< String >` | `[]` | The names of hooks to disable during the service call. `populate`, `fastJoin`, `softDelete` and `stashBefore` are supported. |
| `ignoreDefaults` | `Boolean`         |      | Ignore the defaults `propNames` and `newProps`.                                                                              |
- **Returns**

  - `{Function}`
  
  - **Arguments**

  - `{Object} context`

| Argument  |   Type   | Default | Description                                                 |
| --------- | :------: | ------- | ----------------------------------------------------------- |
| `context` | `Object` |         | The `context` of the hook which will make the service call.   |

  - **Returns**

    - `{Object} newParams`

| Name        |   Type   | Description                      |
| ----------- | :------: | -------------------------------- |
| `newParams` | `Object` | The params for the service call. |

- **Example**

  ```js
  const { callingParams, callingParamsDefaults } = require('feathers-hooks-common');
  // Authentication props to always copy. Suitable for feathers-authentication-management.
  callingParamsDefaults(['provider', 'authenticated', 'user', 'isVerified']);

  async function myCustomHook(context) {
    // ...
    const result = await service.find(callingParams({
      query: { { id: { $in: [1, 2, 3] } } },
      propNames: ['customProp'],
      newProps: { mongoose: ... },
      hooksToDisable: 'populate'
    }))(context);
    // ...
  }
  ```

- **Details**

  When calling another service within a hook, [consideration must be given](https://auk.docs.feathersjs.com/guides/step-by-step/basic-feathers/writing-hooks.html#calling-a-service) to what the `params` should be for the called service. For example, should the called service see that a client is making the call, or the server? What authentication and authorization information should be provided? You can use this convenience function to help create that `params`.

  The properties `provider`, `authenticated` and `user` are the standard authentication properties used by Feathers. They are copied automatically.

  These defaults and others can be changed app-wide by calling the `callingParamsDefaults` utility.

## callingParamsDefaults

Set defaults for building `params` for service calls with callingParams.

- **Arguments**

  - `{Array< String >} propNames`
  - `{Object} newProps`

| Argument    |       Type        | Default | Description                                                                            |
| ----------- | :---------------: | ------- | -------------------------------------------------------------------------------------- |
| `propNames` | `Array< String >` |         | The names of the props in `context.params` to automatically include in the new params. |
| `newProps`  |     `Object`      |         | Additional props to add to the new params.                                             |

- **Example**

  ```js
  const { callingParams, callingParamsDefaults } = require('feathers-hooks-common');
  // Authentication props to always copy. Suitable for feathers-authentication-management.
  // Only hooks will be calling `callingParams`. Set a flag so other hooks recognize such a call.
  callingParamsDefaults(['provider', 'authenticated', 'user', 'isVerified'], { _calledByHook: true });

  async function myCustomHook(context) {
    // ...
    const result = await service.find(callingParams({
      query: { { id: { $in: [1, 2, 3] } } },
      propNames: ['customProp'],
      newProps: { mongoose: ... },
      hooksToDisable: 'populate'
    }), context);
    // ...
  }
  ```

- **Details**

  When calling another service within a hook, [consideration must be given](https://auk.docs.feathersjs.com/guides/step-by-step/basic-feathers/writing-hooks.html#calling-a-service) to what the `params` should be for the called service. For example, should the called service see that a client is making the call, or the server? What authentication and authorization information should be provided? You can use this convenience function to help create that `params`.

  The properties `provider`, `authenticated` and `user` are the standard authentication properties used by Feathers. They are copied automatically.

  These defaults and others can be changed app-wide by calling the `callingParamsDefaults` utility.

## checkContext

Restrict a hook to run for certain methods and method types.

- **Arguments**
  - `{Object} context`
  - `{String} [ type ]`
  - `{Array< String >} [ methods ]`
  - `{String} [ label ]`

| Argument  |       Type        | Default       | Description                                                     |
| --------- | :---------------: | ------------- | --------------------------------------------------------------- |
| `context` |     `Object`      |               | The hook context.                                               |
| `type`    |     `String`      | all types     | The service type allowed - before, after.                       |
| `methods` | `Array< String >` | all methods   | The service methods allowed - find, get, update, patch, remove. |
| `label`   |     `String`      | `'anonymous'` | Name of hook to use with `throw`.                               |

- **Example**

  ```js
  const { checkContext } = require('feathers-hooks-common');

  function myHook(context) {
    checkContext(context, 'after', ['create', 'remove']);
    ...
  }

  module.exports = { before: {
      create: [ myHook ] // throws
  } };

  // checkContext(hook, 'before', ['update', 'patch'], 'hookName');
  // checkContext(hook, null, ['update', 'patch']);
  // checkContext(hook, 'before', null, 'hookName');
  // checkContext(hook, 'before');
  ```

- **Details**

  Its important to ensure the hook is being used as intended. `checkContext` let's you restrict the hook to a hook type and a set of service methods.

## combine

Sequentially execute multiple sync or async hooks.

|before|after|methods|multi|details|
|---|---|---|---|---|
|yes|yes|all|n/a|[source](https://github.com/feathersjs-ecosystem/feathers-hooks-common/blob/master/lib/services/combine.js)|

- **Arguments**
  - `{Array< Function >} hookFuncs`

| Argument    |        Type        | Default | Description                                         |
| ----------- | :----------------: | ------- | --------------------------------------------------- |
| `hookFuncs` | `Array<Function >` |         | Hooks, used the same way as when you register them. |

- **Example**

  ```js
  const { combine, createdAt, updatedAt } = require('feathers-hooks-common')

  async function myCustomHook(context) {
    const newContext = await combine(
      setNow('createdAt'),
      setNow('updatedAt')
    ).call(this, context)
    return newContext
  }
  ```

- **Details**

  `combine` has the signature of a hook, but is primarily intended to be used within your custom hooks, not when registering hooks.

The following is a better technique to use when registering hooks.

```js
const workflow = [createdAt(), updatedAt(), ...];

module.exports = { before: {
  update: [...workflow],
  patch: [...workflow],
} };
```


## getItems

Get the records in `context.data` or `context.result`

- **Arguments**
  - `{Object} context`

| Argument  |   Type   | Default | Description       |
| --------- | :------: | ------- | ----------------- |
| `context` | `Object` |         | The hook context. |

**Returns**

  - `{Array< Object > | Object | undefined} records`

|Name|Type|Description|
|---|---|---|
records|Array< Object > | Object | undefined|The records.

- **Example**

  ```js
  const { getItems, replaceItems } = require('feathers-hooks-common');

  const insertCode = code => context => {
    const items = getItems(context);
    if (Array.isArray(items)) {
      items.forEach(item => { item.code = code; });
    } else {
      items.code = code;
    }
    replaceItems(context, items);
  };

  module.exports = { before: {
    create: insertCode('a')
  } };
  ```

- **Details**

  `getItems` gets the records from the hook context: `context.data` (before hook) or `context.result[.data]` (after hook).


## replaceItems

Replace the records in context.data or context.result[.data].

- **Arguments**

  - `{Object} context`
  - `{Array< Object > | Object} records`

| Argument  |            Type            | Default | Description       |
| --------- | :------------------------: | ------- | ----------------- |
| `context` |          `Object`          |         | The hook context. |
| `records` | `Array< Object >` `Object` |         | The new records.  |

- **Example**

  ```js
  const { getItems, replaceItems } = require('feathers-hooks-common');

  const insertCode = code => context {
    const items = getItems(context);
    if (Array.isArray(items)) {
      items.forEach(item => { item.code = code; });
    } else {
      items.code = code;
    }
    replaceItems(context, items);
  };

  module.exports = { before: {
    create: insertCode('a')
  } };
  ```

- **Details**

  `replaceItems` replaces the records in the hook context: `context.data` (before hook) or `context.result[.data]` (after hook).


## makeCallingParams

Build context.params for service calls.

> __Tip:__ You should prefer using the `callingParams` utility to `makeCallingParams`.

- **Arguments**

  - `{Object} context`
  - `{Object} [ query ]`
  - `{Array< String > | String} [ include ]`
  - `{Object} [ inject ]`

| Argument  |       Type        | Default | Description                                                        |
| --------- | :---------------: | ------- | ------------------------------------------------------------------ |
| `context` |     `Object`      |         | The existing hook context.                                         |
| `query`   |     `Object`      |         | The `context.params.query` for the new context.                    |
| `include` | `Array< String >` |         | The names of the props in `context` to include in the new context. |
| `inject`  |     `Object`      |         | Additional props to add to the new context.                        |

- **Returns**

  - `{Object} newContext`

| Variable     |   Type   | Default | Description              |
| ------------ | :------: | ------- | ------------------------ |
| `newContext` | `Object` |         | The new context created. |

- **Example**

  ```js
  const { makeCallingParams } = require('feathers-hooks-common');

  async function myCustomHook(context) {
    // ...
    const result = await service.find(makeCallingParams(
      context, { id: { $in: [1, 2, 3] } }, 'user',
      { _populate: false, mongoose: ... }
    ));
    // ...
  }
  ```

- **Details**

  When calling another service within a hook, [consideration must be given](https://auk.feathersjs.com/guides/step-by-step/basic-feathers/writing-hooks.html#calling-a-service) to what the `context.params` should be for the called service. For example, should the called service see that a client is making the call, or the server? What authentication and authorization information should be provided? You can use this convenience function to help create that `context.params`.

  The value `context.params._populate: 'skip'` is automatically added to skip any `fastJoin` or `populate` hooks registered on the called service. Set it to `false`, like in the example above, to make those hooks run.


## paramsForServer

Pass an explicit context.params from client to server. Client-side.

- **Arguments**
  - `{Object} params`
  - `{Array< String >} [ whitelist ]`

| Argument    |     Type     | Default                       | Description                                                                                                                                            |
| ----------- | :----------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `params`    |   `Object`   |                               | The `context.params` to use for the service call, including any query object.                                                                          |
| `whitelist` | dot notation | all props in `context.params` | Names of the props in `context.params` to transfer to the server. This is a security feature. All props are transferred if no `whitelist` is provided. |

- **Example**

  ```js
  // client
  const { paramsForServer } = require('feathers-hooks-common')

  service.update(
    id,
    data,
    paramsForServer({
      query: { dept: 'a' },
      populate: 'po-1',
      serialize: 'po-mgr'
    })
  )

  // server
  const { paramsFromClient } = require('feathers-hooks-common')

  module.exports = {
    before: {
      all: [paramsFromClient('populate', 'serialize', 'otherProp'), myHook]
    }
  }

  // myHook's `context.params` will now be
  // { query: { dept: 'a' }, populate: 'po-1', serialize: 'po-mgr' } }
  ```

- **Details**

  By default, only the `context.params.query` object is transferred from a Feathers client to the server, for security among other reasons. However you can explicitly transfer other `context.params` props with the client utility function `paramsForServer` in conjunction with the `paramsFromClient` hook on the server.

  This technique also works for service calls made on the server.

  <p class="tip">The data is transfered using `context.params.query.$client`. If that field already exists, it must be an Object.</p>


## runHook

Let's you call a hook right after the service call.

- **Arguments**
  - `{Object} [ hookContext ]`
  - `{Function} hookFunc`

| Argument      |    Type    | Default | Description                   |
| ------------- | :--------: | ------- | ----------------------------- |
| `hookContext` |  `Object`  | `{}`    | The `context` for `hookFunc`. |
| `hookFunc`    | `Function` |         | The hook to run.              |

- **Example**

  ```js
  const { keep, runHook } = require('feathers-hooks-common');

  user.get(...)
    .then( runHook()(keep('name', 'address.state')) )
    .then(data => ...); // [{ name: 'Marshall', address: { state: 'UT' }}]

  const data = await user.get(...);
  const result = await runHook()(data)(keep('name', 'address.state'));
  ```

  ```js
  const { fastJoin, runHook } = require('feathers-hooks-common')
  const runHookFinds = runHook({ app: app, method: 'find' })

  const paymentsRecords = [
    { _id: 101, amount: 100, patientId: 1 },
    { _id: 102, amount: 105, patientId: 1 },
    { _id: 103, amount: 110, patientId: 1 },
    { _id: 104, amount: 115, patientId: 2 },
    { _id: 105, amount: 120, patientId: 3 },
    { _id: 106, amount: 125, patientId: 3 }
  ]
  await payments.create(paymentsRecords)

  const patientsRecords = [
    { _id: 1, name: 'John' },
    { _id: 2, name: 'Marshall' },
    { _id: 3, name: 'David' }
  ]
  await patients.create(patientsRecords)

  const paymentResolvers = {
    joins: {
      patient: () => async payment => {
        payment.patient = (
          await patients.find({
            query: {
              id: payment.patientId
            }
          })
        )[0]
      }
    }
  }

  await payments
    .find()
    .then(runHookFinds(fastJoin(paymentResolvers)))
    .then(data => console.log(data))

  // log
  ;[
    { _id: 101, amount: 100, patientId: 1, patient: { _id: 1, name: 'John' } },
    { _id: 102, amount: 105, patientId: 1, patient: { _id: 1, name: 'John' } },
    { _id: 103, amount: 110, patientId: 1, patient: { _id: 1, name: 'John' } },
    {
      _id: 104,
      amount: 115,
      patientId: 2,
      patient: { _id: 2, name: 'Marshall' }
    },
    { _id: 105, amount: 120, patientId: 3, patient: { _id: 3, name: 'David' } },
    { _id: 106, amount: 125, patientId: 3, patient: { _id: 3, name: 'David' } }
  ]
  ```

- **Details**

  Hooks are normally registered for a service, e.g. in `project/src/services` `/posts/posts.hooks.js`. This is nice and simple when, for example, all the `find` hooks have to run for every `find` call.

  The [conditional hooks](#tag-Conditionals) can be used when hooks have to be conditionally run based on the current environment. For example, we can discard the `password` field when the call is made by a client.

  However things are not always so straightforward. There can be that one call for which we want to join specific records. We could add a conditional hook that runs just for that one call, however we may soon find ourselves with a second and a third special case.

  `runHook` is designed for such cases. Instead of having to register a conditioned hook, it allows us to run the hook in a `.then()` right after the service call.
