---
title: Hooks
---

# Hooks

<!--=============================================================================================-->

## actOnDefault

{% hooksApi actOnDefault %}

- **Arguments**

  - `{...Function}` Hook functions.

| Argument |     Type      | Default | Description                                                                                                                                    |
| -------- | :-----------: | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks`  | `...Function` |         | The hooks to run. They will mutate `context.data` for before hooks, or `context.result` for after hooks. This is the default action for hooks. |

- **Example**

  ```js
  const { actOnDefault, actOnDispatch } = require('feathers-hooks-common')

  module.exports = {
    after: {
      find: [
        hook1(),
        actOnDispatch(hook2(), actOnDefault(hook3()), hook4()),
        hook5()
      ]
    }
  }
  ```

  Hooks `hook1`, `hook3` and `hook5` will run "normally", mutating `content.result`.
  Hooks `hook2` and `hook4` will mutate `context.dispatch`.

- **Details**

  A hook can call a series of hooks using `actOnDispatch`. Some of those hooks may call other hooks with `actOnDefault` or `actOnDispatch`. This can "turtle down" to further layers.

  The main purpose of `actOnDefault` is to "undo" `actOnDispatch`.

{% hooksApiFootnote actOnDefault %}

<!--=============================================================================================-->

## actOnDispatch

{% hooksApi actOnDispatch %}

- **Arguments**

  - `{...Function}` Hook functions.

| Argument |     Type      | Default | Description                                            |
| -------- | :-----------: | ------- | ------------------------------------------------------ |
| `hooks`  | `...Function` |         | The hooks to run. They will mutate `context.dispatch`. |

- **Example**

  ```js
  const { actOnDefault, actOnDispatch } = require('feathers-hooks-common')

  module.exports = {
    after: {
      find: [
        hook1(),
        actOnDispatch(hook2(), actOnDefault(hook3()), hook4()),
        hook5()
      ]
    }
  }
  ```

  Hooks `hook1`, `hook3` and `hook5` will run "normally", mutating `content.result`.
  Hooks `hook2` and `hook4` will mutate `context.dispatch`.

- **Details**

  A hook can call a series of hooks using `actOnDispatch`. Some of those hooks may call other hooks with `actOnDefault` or `actOnDispatch`. This can "turtle down" to further layers.

  <p class="tip">context.dispatch is a writeable, optional property and contains a "safe" version of the data that should be sent to any client. If context.dispatch has not been set context.result will be sent to the client instead.<br/><br/>Note: context.dispatch only affects the data sent through a Feathers Transport like REST or Socet.io. An internal method call will still get the data set in context.result.</p>

{% hooksApiFootnote actOnDispatch %}

## alterItems

{% hooksApi alterItems %}

- **Arguments**
  - `{Function} func`

| Argument |    Type    | Default                     | Description                                   |
| -------- | :--------: | --------------------------- | --------------------------------------------- |
| `func`   | `Function` | `(item,` `context) =>` `{}` | Function modifies `item` in place. See below. |

{% hooksApiReturns alterItems "The mutated <code>item</code>. Returning <code>undefined</code> means the <code>item</code> in the parameters was mutated in place." result "undefined || item" %}

- **Example**

  ```js
  const { alterItems } = require('feathers-hooks-common');

  module.exports = { before: {
      all: [
        alterItems(rec => { delete rec.password; }) // Like `discard('password')`.
        alterItems(rec => rec.email = email.lowerCase()), // Like `lowerCase('email')`.
      ],
  } };
  ```

  Async mutations can be handled with async/await:

  ```js
  alterItems(rec => {
    rec.userRecord = (async () => await service.get(...) )()
  })
  ```

  You can also perform async mutations using Promises by returning a Promise that is resolved once all mutations are complete:

  ```js
  alterItems(rec => new Promise(resolve => {
    service.get(...).then(result => {
      rec.userRecord = result;
      resolve();
  }});
  ```

  You can also perform async mutations using Promises by returning a Promise that is resolved once all mutations are complete:

  ```js
  alterItems(async rec => {
    rec.userRecord = await service.get(...);
  })
  ```

- **Details**

  The declarative nature of most of the common hooks, e.g. `discard('password')`, requires you to remember the names of a fair number of hooks, their parameters, and any possible nuances.

  The `alterItems` hook offers an imperative alternative where you directly alter the items. It allows you to reduce the number of trivial hooks you have to register, and you are aware of exactly what your `alterItems` hooks do.

  `func` is called for each item in `context.data` (before hook) or `context.result[.data]` (after hook). It receives the parameters

  - `{Object} item`
  - `{Object} context`

  | Argument  |   Type   | Description                                                            |
  | --------- | :------: | ---------------------------------------------------------------------- |
  | `item`    | `Object` | The item. The function modifies it in place.                           |
  | `context` | `Object` | The current context. It contains any alterations made to items so far. |

- **Returns**

  `func` may alternatively return a replacement `item` rather than `undefined`. This is a convenience feature which permits, for example, use of functions from the [Lodash](https://lodash.com/) library, as such functions tend to return new objects.

{% hooksApiFootnote alterItems %}

## cache

{% hooksApi cache %}

- **Arguments**

  - `{Object | Map} cacheMap`
  - `{String} [ keyField ]`
  - `{Object} [ options ]`
    - `{Function} [ clone ]`
    - `{Function} [makeCacheKey]`

| Argument   |      Type      | Default                                            | Description                                                                  |
| ---------- | :------------: | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `cacheMap` | `Object` `Map` |                                                    | Instance of `Map`, or an object with a similar API, to be used as the cache. |
| `keyField` |    `String`    | `context.service.id` or `item._id ? '_id' !! 'id'` | The name of the record id field.                                             |
| `option`   |    `Object`    |                                                    | Options.                                                                     |

| `options` | Argument   |                      Type                      | Default                                                                                                                                          | Description |
| --------- | ---------- | :--------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `clone`   | `Function` | `item => JSON.parse(` `JSON.stringify(item) )` | Function to perform a deep clone. See below.                                                                                                     |
| `clone`   | `Function` |                  `key => key`                  | Function to convert record key to cache key. Use this to convert MongoDB/Mongoose ObjectId/bson keys to a cache key using `item._id.toString()`. |

- **Example**

  ```js
  const CacheMap = require('@feathers-plus/cache')
  const { cache } = require('feathers-hooks-common')

  const cacheMap = CacheMap({ max: 100 }) // Keep the 100 most recently used.

  module.exports = {
    before: {
      all: cache(cacheMap)
    },
    after: {
      all: cache(cacheMap)
    }
  }
  ```

  ```js
  const { cache } = require('feathers-hooks-common')

  const cacheMap = new Map()

  module.exports = {
    before: {
      all: cache(cacheMap)
    },
    after: {
      all: cache(cacheMap)
    }
  }
  ```

  ```js
  const CacheMap = require('@feathers-plus/cache')
  const mongoose = require('mongoose')
  const { cache } = require('feathers-hooks-common')

  const cacheMap = CacheMap({ max: 100 })
  const makeCacheKey = key =>
    key instanceof mongoose.Types.ObjectId ? key.toString() : key

  module.exports = {
    before: {
      all: cache(cacheMap, undefined, { makeCacheKey })
    },
    after: {
      all: cache(cacheMap, undefined, { makeCacheKey })
    }
  }
  ```

  > The `cache` hook **must** be registered in both `before` and `after`.

  <p class="tip">The cache will grow without limit when `Map` is used and the resulting memory pressure may adversely affect your performance. `Map` should only be used when you know or can control its size.</p>

- **Details**

  The `cache` hook maintain a persistent cache for the service it is registerd on. A persistent cache stores records so future requests for those records can be served faster; the records stored in the cache are duplicates of records stored in the database.

  The `get` service method retrieves records from the cache and updates `context.result` `[.data]`. The other methods remove their `context.data` entries from the cache in the `before` hook, and add entries in the `after` hook. All the records returned by a `find` call are added to the cache.

  The `cache` hook may be provided a custom Map instance to use as its memoization cache. Any object that implements the methods get(), set(), delete() and clear() can be provided. This allows for custom Maps which implement various [cache algorithms](https://en.wikipedia.org/wiki/Cache_replacement_policies) to be provided.

  The companion `@feathers-plus/cache` provides a least recently-used cache which discards the least recently used items first. It is compatible with `cache` as well as the BatchLoaders used with the `fastJoin` hook.

  > The `cache` hook can make [fastJoin](#fastjoin) hooks run more efficiently.

  MongoDB and Mongoose store record keys as bson objects rather than as scalars. The safest way to use the cache is in conjunction with the `makeCacheKey` option.

- **options.clone**

  The clone function has a single parameter.

  - `{Object} item`

  It returns

  - `{Object} clonedItem`

| Argument     |   Type   | Default | Description        |
| ------------ | :------: | ------- | ------------------ |
| `item`       | `Object` |         | The record.        |
| `clonedItem` | `Object` |         | A clone of `item`. |

{% hooksApiFootnote cache %}

## debug

{% hooksApi debug %}

- **Arguments**
  - `{String} label`
  - `{Array < String >} [ fieldNames ]`

| Argument     |     Type     | Default | Description                                      |
| ------------ | :----------: | ------- | ------------------------------------------------ |
| `label`      |   `String`   |         | Label to identify the logged information.        |
| `fieldNames` | dot notation |         | The field values in `context.params` to display. |

- **Example**

  ```js
  const { debug } = require('feathers-hooks-common');

  module.exports = { before: {
      all: [ debug('step 1'), setNow('updatedAt'), debug(' step 2') ],
  } };

  // Result
  * step 1
  type: before, method: create
  data: { name: 'Joe Doe' }
  query: { sex: 'm' }
  result: { assigned: true }
  params props: [ 'query' ]
  * step 2
  type: before, method: create
  data: { name: 'Joe Doe', createdAt: 1510518511547 }
  query: { sex: 'm' }
  result: { assigned: true }
  params props: [ 'query' ]
  params.query: { sex: 'm' }
  error: ...
  ```

- **Details**

  `debug` is great for debugging issues with hooks. Log the hook context before and after a hook to see what the hook started with, and what it changed.

{% hooksApiFootnote debug %}

## dePopulate

{% hooksApi dePopulate %}

- **Arguments**
  - `{Function} customDepop`

| Argument      |    Type    | Default      | Description                            |
| ------------- | :--------: | ------------ | -------------------------------------- |
| `customDepop` | `Function` | `rec => rec` | Additional modifications for a record. |

- **Example**

  ```js
  const { dePopulate } = require('feathers-hooks-common')

  module.exports = {
    before: {
      all: [depopulate()]
    }
  }
  ```

- **Details**

  Removes joined records, computed properties, and profile information created by [`populate`](#populate). Populated and serialized items may, after dePopulate, be used in service calls.

  Removes fields created by resolver functions using `fgraphql`. Populated items may, after dePopulate, be used in a patch service call..

{% hooksApiFootnote dePopulate %}

## disableMultiItemChange

{% hooksApi disableMultiItemChange %}

- **Example**

  ```js
  const { disableMultiItemChange } = require('feathers-hooks-common')

  module.exports = {
    before: {
      patch: disableMultiItemChange(),
      remove: disableMultiItemChange()
    }
  }
  ```

- **Details**

  When using the `patch` or `remove` methods, a `null` id could mutate many, even all the records in the database, so accidentally using it may cause undesirable results.

{% hooksApiFootnote disableMultiItemChange %}

## disableMultiItemCreate

{% hooksApi disableMultiItemCreate %}

- **Example**

  ```js
  const { disableMultiItemCreate } = require('feathers-hooks-common')

  module.exports = {
    before: {
      create: disableMultiItemCreate()
    }
  }
  ```

- **Details**

  The `create` method creates multiple record if passed an array of items. This hook prevents that, allowing only single records to be created.

{% hooksApiFootnote disableMultiItemCreate %}

## disablePagination

{% hooksApi disablePagination %}

- **Example**

  ```js
  const { disablePagination } = require('feathers-hooks-common')

  module.exports = {
    before: {
      find: disablePagination()
    }
  }
  ```

- **Details**

  Pagination is disabled if `context.query.$limit` is -1 or '-1'. It works for all types of calls including REST.

{% hooksApiFootnote disablePagination %}

## disallow

{% hooksApi disallow %}

- **Arguments**

  - `{Array< String >} transports`

| Argument     |       Type        | Default                 | Description                               |
| ------------ | :---------------: | ----------------------- | ----------------------------------------- |
| `transports` | `Array< String >` | disallow all transports | The transports that you want to disallow. |

| `transports` | Value                                 | Description |
| ------------ | ------------------------------------- | ----------- |
| `socketio`   | disallow calls by Socket.IO transport |
| `primus`     | disallow calls by Primus transport    |
| `rest`       | disallow calls by REST transport      |
| `external`   | disallow calls other than from server |
| `server`     | disallow calls from server            |

- **Example**

  ```js
  const { disallow, iff } = require('feathers-hooks-common')

  module.exports = {
    before: {
      // Users can not be created by external access
      create: disallow('external'),
      // A user can not be deleted through the REST provider
      remove: disallow('rest'),
      // disallow calling `update` completely (e.g. to allow only `patch`)
      update: disallow(),
      // disallow the remove hook if the user is not an admin
      remove: iff(context => !context.params.user.isAdmin, disallow())
    }
  }
  ```

- **Details**

  Prevents access to a service method completely or just for specific transports. All transports set the `context.params.provider` property, and `disallow` checks this.

{% hooksApiFootnote disallow %}

## discard

{% hooksApi discard %}

<p class="tip">The discard hook will remove fields even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), discard(...))`.</p>

{% hooksApiFieldNames discard "One or more fields you want to remove from the record(s)." %}

- **Example**

  ```js
  const { discard, iff, isProvider } = require('feathers-hooks-common')

  module.exports = {
    after: {
      all: iff(isProvider('external'), discard('password', 'address.city'))
    }
  }
  ```

- **Details**

  Delete the fields either from `context.data` (before hook) or `context.result[.data]` (after hook).
  They are not modified if they are not an object, so a `null` value is supported.

{% hooksApiFootnote discard %}

## discardQuery

{% hooksApi discardQuery %}

<p class="tip">The keep hook will remove any fields not specified even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), discardQuery(...))`.</p>

{% hooksApiFieldNames discardQuery "One or more fields you want to remove from the query." %}

- **Example**

  ```js
  const { discardQuery, iff, isProvider } = require('feathers-hooks-common')

  module.exports = {
    after: {
      all: iff(isProvider('external'), discardQuery('secret'))
    }
  }
  ```

- **Details**

  Delete the fields from `context.params.query`.

{% hooksApiFootnote discardQuery %}

## every

{% hooksApi every %}

- **Arguments**
  - `{Array< Function >} predicates`

| Argument     |        Type         | Default | Description                                                                   |
| ------------ | :-----------------: | ------- | ----------------------------------------------------------------------------- |
| `predicates` | `Array< Function >` |         | Functions which take the current hook as a param and return a boolean result. |

{% hooksApiReturns every "The logical and of <code>predicates</code>" %}

- **Example**

  ```js
  const { iff, every } = require('feathers-hooks-common');

  module.exports = { before: {
      create: iff(every(hook1, hook2, ...), hookA, hookB, ...)
  } };
  ```

- **Details**

  `every` is a predicate function for use in conditional hooks. The predicate functions are run in parallel, and `true` is returned if every predicate returns a truthy value.

{% hooksApiFootnote every %}

## fastJoin

{% hooksApi fastJoin %}

> `fastJoin` is preferred over using `populate`.

- **Arguments**

  - `{Object | Function} resolvers`

    - `{Function} [ before ]`
    - `{Function} [ after ]`
    - `{Object} joins`

  - `{Object | Function} [ query ]`

| Argument    | Type                              | Default                                   | Description                                                       |
| ----------- | --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `resolvers` | `Object` or `context` `=> Object` |                                           | The group of operations to perform on the data.                   |
| `query`     | `Object`                          | run all resolvers with `undefined` params | You can customise the current operations with the optional query. |

| `resolvers` | Argument           | Type | Default                                                                                                                    | Description |
| ----------- | ------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `before`    | `context` `=> { }` |      | Processing performed before the operations are started. Batch-loaders are usually created here.                            |
| `after`     | `context` `=> { }` |      | Processing performed after all other operations are completed.                                                             |
| `joins`     | `Object`           |      | Resolver functions provide a mapping between a portion of a operation and actual backend code responsible for handling it. |

> Read the [guide](guide.html#fastjoin) for more information on the arguments.

- **Example using Feathers services**

  <p class="tip">The services in all these examples are assumed, for simplicity, to have pagination disabled. You will have to decide when to use `paginate: false` in your code.</p>
  ``` js
  // project/src/services/posts/posts.hooks.js
  const { fastJoin } = require('feathers-hooks-common');

  const postResolvers = {
  joins: {
  author: (...args) => async post => post.author = (await users.find({
  query: { id: post.userId },
  paginate: false
  }))[0],

  starers: $select => async post => post.starers = await users.find({
        query: { id: { $in: post.starIds }, $select: $select || ['name'] },
  paginate: false
  }),
  }
  };

  const query = {
  author: true,
  starers: [['id', 'name']]
  };

  module.exports = { after: {
  all: [ fastJoin(postResolvers, query) ],
  } };

  // Original record
  [ { id: 1, body: 'John post', userId: 101, starIds: [102, 103, 104] } ]

  // Result
  [ { id: 1,
  body: 'John post',
  userId: 101,
  starIds: [ 102, 103, 104 ],
  author: { id: 101, name: 'John' },
  starers: [ { name: 'Marshall' }, { name: 'Barbara' }, { name: 'Aubree' } ]
  }]

  ```

  ```

- **Example with recursive operations**

  ```js
  // project/src/services/posts/posts.hooks.js
  const { fastJoin } = require('feathers-hooks-common');

  const postResolvers = {
    joins: {
      comments: {
        resolver: ($select, $limit, $sort) => async post => post.comments = await comments.find({
          query: { postId: post.id, $select: $select, $limit: $limit || 5, [$sort]: { createdAt: -1 } },
          paginate: false
        }),

        joins: {
          author: $select => async comment => comment.author = (await users.find({
            query: { id: comment.userId, $select: $select },
            paginate: false
          }))[0],
        },
      },
    }
  };

  const query = {
    comments: {
      args: [...],
      author: [['id', 'name']]
    },
  };

  module.exports = { after: {
      all: [ fastJoin(postResolvers, query) ],
  } };

  // Original record
  [ { id: 1, body: 'John post', userId: 101, starIds: [102, 103, 104] } ]

  // Result
  [ { id: 1,
      body: 'John post',
      userId: 101,
      starIds: [ 102, 103, 104 ],
      comments:
       [ { id: 11,
           text: 'John post Marshall comment 11',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } },
         { id: 12,
           text: 'John post Marshall comment 12',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } },
         { id: 13,
           text: 'John post Marshall comment 13',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } } ]
  } ]
  ```

- **Example with a simple batch-loader**

  ```js
  // project/src/services/posts/posts.hooks.js
  const { fastJoin } = require('feathers-hooks-common')
  const BatchLoader = require('@feathers-plus/batch-loader')
  const { loaderFactory } = BatchLoader

  const postResolvers = {
    before: context => {
      context._loaders = { user: {} }
      context._loaders.user.id = loaderFactory(users, 'id', false, {
        paginate: false
      })(context)
    },
    joins: {
      author: () => async (post, context) =>
        (post.author = await context._loaders.user.id.load(post.userId)),

      starers: () => async (post, context) =>
        !post.starIds
          ? null
          : (post.starers = await context._loaders.user.id.loadMany(
              post.starIds
            ))
    }
  }

  module.exports = {
    after: {
      all: [fastJoin(postResolvers)]
    }
  }

  // Original record
  ;[{ id: 1, body: 'John post', userId: 101, starIds: [102, 103, 104] }][
    // Result
    {
      id: 1,
      body: 'John post',
      userId: 101,
      starIds: [102, 103, 104],
      author: { id: 101, name: 'John' },
      starers: [
        { id: 102, name: 'Marshall' },
        { id: 103, name: 'Barbara' },
        { id: 104, name: 'Aubree' }
      ]
    }
  ]
  ```

- **Comprehensive example**

  ```js
  // project/src/services/posts/posts.hooks.js
  const { fastJoin, makeCallingParams } = require('feathers-hooks-common');
  const BatchLoader = require('@feathers-plus/batch-loader');
  const { getResultsByKey, getUniqueKeys } = BatchLoader;

  const commentResolvers = {
    joins: {
      author: () => async (comment, context) => !comment.userId ? null :
        comment.userRecord = await context._loaders.user.id.load(comment.userId)
    },
  };

  const postResolvers = {
    before: context => {
      context._loaders = { user: {}, comments: {} };

      context._loaders.user.id = new BatchLoader(async (keys, context) => {
          const result = await users.find(makeCallingParams(
            context, { id: { $in: getUniqueKeys(keys) } }, undefined, { paginate: false }
          ));
          return getResultsByKey(keys, result, user => user.id, '!');
        },
        { context }
      );

      context._loaders.comments.postId = new BatchLoader(async (keys, context) => {
          const result = await comments.find(makeCallingParams(
            context, { postId: { $in: getUniqueKeys(keys) } }, undefined, { paginate: false }
          ));
          return getResultsByKey(keys, result, comment => comment.postId, '[!]');
        },
        { context }
      );
    },
    joins: {
      author: () => async (post, context) =>
        post.userRecord = await context._loaders.user.id.load(post.userId),

      starers: () => async (post, context) => !post.starIds ? null :
        post.starIdsRecords = await context._loaders.user.id.loadMany(post.starIds),

      comments: {
        resolver: (...args) => async (post, context) =>
          post.commentRecords = await context._loaders.comments.postId.load(post.id),

        joins: commentResolvers,
      },
    }
  };

  const query = {
    author: true,
    starers: [['id', 'name']],
    comments: {
      args: null,
      author: [['id', 'name']]
    },
  };

  module.exports = { after: {
      all: [ fastJoin(postResolvers, context => query) ],
  } };

  // Original record
  [ { id: 1,
      body: 'John post',
      userId: 101,
      starIds: [102, 103, 104],
      reputation: [ // The `populate` hook cannot handle this structure.
        { userId: 102, points: 1 },
        { userId: 103, points: 1 },
        { userId: 104, points: 1 }
      ]},
  ]

  // Results
  [ { id: 1,
      body: 'John post',
      userId: 101,
      starIds: [ 102, 103, 104 ],
      reputation:
       [ { userId: 102, points: 1, author: 'Marshall' },
         { userId: 103, points: 1, author: 'Barbara' },
         { userId: 104, points: 1, author: 'Aubree' } ],
      author: { id: 101, name: 'John' },
      comments:
       [ { id: 11,
           text: 'John post Marshall comment 11',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } },
         { id: 12,
           text: 'John post Marshall comment 12',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } },
         { id: 13,
           text: 'John post Marshall comment 13',
           postId: 1,
           userId: 102,
           author: { id: 102, name: 'Marshall' } } ],
      starers:
       [ { id: 102, name: 'Marshall' },
         { id: 103, name: 'Barbara' },
         { id: 104, name: 'Aubree' } ] },
  ]
  ```

- **Example Using a Persistent Cache**

  ```js
  const {
    cache,
    fastJoin,
    makeCallingParams
  } = require('feathers-hooks-common')
  const BatchLoader = require('@feathers-plus/batch-loader')
  const CacheMap = require('@feathers-plus/cache')
  const { getResultsByKey, getUniqueKeys } = BatchLoader

  // Create a cache for a maximum of 100 users
  const cacheMapUsers = CacheMap({ max: 100 })

  // Create a batchLoader using the persistent cache
  const userBatchLoader = new BatchLoader(
    async keys => {
      const result = await users.find(
        makeCallingParams({}, { id: { $in: getUniqueKeys(keys) } }, undefined, {
          paginate: false
        })
      )
      return getResultsByKey(keys, result, user => user.id, '!')
    },
    { cacheMap: cacheMapUsers }
  )

  const postResolvers = {
    before: context => {
      context._loaders = { user: {} }
      context._loaders.user.id = userBatchLoader
    },

    joins: {
      author: () => async (post, context) =>
        (post.author = await context._loaders.user.id.load(post.userId)),

      starers: () => async (post, context) =>
        !post.starIds
          ? null
          : (post.starers = await context._loaders.user.id.loadMany(
              post.starIds
            ))
    }
  }

  const query = {
    author: true,
    starers: [['id', 'name']],
    comments: {
      args: null,
      author: [['id', 'name']]
    }
  }

  module.exports = {
    before: {
      all: cache(cacheMapUsers)
    },
    after: {
      all: [cache(cacheMapUsers), fastJoin(postResolvers, () => query)]
    }
  }
  ```

  The number of service calls needed to run the `query` above **the second time**:

|                  Using | number of service calls |
| ---------------------: | :---------------------: |
|             `populate` |         **22**          |
|       `fastJoin` alone |          **2**          |
| `fastJoin` and `cache` |          **0**          |

The `cache` hook also makes `get` service calls more efficient.

> The `cache` hook **must** be registered in both `before` and `after`.

- **Details**

  We often want to combine rows from two or more tables based on a relationship between them. The `fastJoin` hook will select records that have matching values in both tables. It can batch service calls and cache records, thereby needing roughly an order of magnitude fewer database calls than the `populate` hook, e.g. _2_ calls instead of _20_.

  Relationships such as `1:1`, `1:m`, `n:1`, and `n:m` relationships can be handled.

  `fastJoin` uses a GraphQL-like imperative API, and it is not restricted to using data from Feathers services. Resources for which there are no Feathers adapters can [be used.](../batch-loader/common-patterns.html#Using-non-Feathers-services)

  The companion `@feathers-plus/cache` implements a least recently-used cache which discards the least recently used items first. When used in conjunction with the `cache` hook, it can be used to implement persistent caches for BatchLoaders. BatchLoaders configured this way would retain their cache between requests, eliminating the need to _prime_ the cache at the start of each request.

{% hooksApiFootnote fastJoin %}

## iff

{% hooksApi iff %}

- **Arguments**
  - `{Boolean | Promise | Function} predicate`
  - `{Array< Function >} hookFuncsTrue`
  - `{Array< Function >} hookFuncsFalse`

| Argument         |                Type                | Default | Description                                                                                                                                                                                                 |
| ---------------- | :--------------------------------: | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `predicate`      | `Boolean`, `Promise` or `Function` |         | Determine if `hookFuncsTrue` or `hookFuncsFalse` should be run. If a function, `predicate` is called with the `context` as its param. It returns either a boolean or a Promise that evaluates to a boolean. |
| `hookFuncsTrue`  |       `Array<` `Function >`        |         | Sync or async hook functions to run if `true`. They may include other conditional hooks.                                                                                                                    |
| `hookFuncsFalse` |       `Array<` `Function >`        |         | Sync or async hook functions to run if `false`. They may include other conditional hooks.                                                                                                                   |

- **Example**

  ```js
  const { discard, iff, isProvider, populate } = require('feathers-hooks-common');
  const isNotAdmin = adminRole => context => context.params.user.roles.indexOf(adminRole || 'admin') === -1;

  module.exports = { before: {
    create: iff(
      () => new Promise((resolve, reject) => { ... }),
      populate('user', { field: 'authorisedByUserId', service: 'users' })
    ),

    get: [ iff(isNotAdmin(), discard('budget')) ]

    update:
      iff(isProvider('server'),
        hookA,
        iff(isProvider('rest'), hook1, hook2, hook3)
        .else(hook4, hook5),
        hookB
      )
      .else(
        iff(hook => hook.path === 'users', hook6, hook7)
      )
  } };
  ```

- **Details**

  Resolve the predicate, then run one set of hooks sequentially.

  The predicate and hook functions will not be called with `this` set to the service, as is normal for hook functions. Use `hook.service` instead.

{% hooksApiFootnote iff %}

## iffElse

{% hooksApi iffElse %}

- **Arguments**
  - `{Function} predicate`
  - `{Array< Functions >} hookFuncsTrue`
  - `{Array< Functions >} hookFuncsFalse`

| Argument         |                Type                | Default | Description                                                                                                                                                                                                 |
| ---------------- | :--------------------------------: | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `predicate`      | `Boolean`, `Promise` or `Function` |         | Determine if `hookFuncsTrue` or `hookFuncsFalse` should be run. If a function, `predicate` is called with the `context` as its param. It returns either a boolean or a Promise that evaluates to a boolean. |
| `hookFuncsTrue`  |       `Array<` `Function >`        |         | Sync or async hook functions to run if `true`. They may include other conditional hooks.                                                                                                                    |
| `hookFuncsFalse` |       `Array<` `Function >`        |         | Sync or async hook functions to run if `false`. They may include other conditional hooks.                                                                                                                   |

- **Example**

  ```js
  const { iffElse, populate, serialize } = require('feathers-hooks-common');

  module.exports = { after: {
    create: iffElse(() => { ... },
      [populate(poAccting), serialize( ... )],
      [populate(poReceiving), serialize( ... )]
    )
  } };
  ```

- **Details**

  Resolve the predicate, then run one set of hooks sequentially.

  The predicate and hook functions will not be called with `this` set to the service, as is normal for hook functions. Use `hook.service` instead.

{% hooksApiFootnote iffElse %}

## isNot

{% hooksApi isNot %}

- **Arguments**

  - `{Function | Boolean} predicate`

| Argument    |         Type         | Default | Description                                                                                   |
| ----------- | :------------------: | ------- | --------------------------------------------------------------------------------------------- |
| `predicate` | `Function` `Boolean` |         | A sync or async function which take the current hook as a param and returns a boolean result. |

{% hooksApiReturns isNot "The not of <code>predicate</code>" %}

- **Example**

  ```js
  const { iff, isNot, isProvider, discard } = require('feathers-hooks-common');
  const isRequestor = () => context => new Promise(resolve, reject) => ... );

  module.exports = { after: {
      create: iff(isNot(isRequestor()), discard('password'))
  } };
  ```

- **Details**

  `isNot` is a predicate function for use in conditional hooks.

{% hooksApiFootnote isNot %}

## isProvider

{% hooksApi isProvider %}

- **Arguments**
  - `{Array< String >} transports`

| Name         |       Type        | Default | Description                       |
| ------------ | :---------------: | ------- | --------------------------------- |
| `transports` | `Array< String >` |         | The transports you want to allow. |

| `transports` |                Value                | Description |
| ------------ | :---------------------------------: | ----------- |
| `socketio`   | Allow calls by Socket.IO transport. |
| `primus`     |  Allow calls by Primus transport.   |
| `rest`       |   Allow calls by REST transport.    |
| `external`   | Allow calls other than from server. |
| `server`     |      Allow calls from server.       |

{% hooksApiReturns isProvider "If the call was made by one of the <code>transports</code>." %}

- **Example**

  ```js
  const { iff, isProvider, discard } = require('feathers-hooks-common')

  module.exports = {
    after: {
      create: iff(isProvider('external'), discard('password'))
    }
  }
  ```

- **Details**

  `isProvider` is a predicate function for use in conditional hooks. Its determines which transport provided the service call by checking `context.params.provider`.

{% hooksApiFootnote isProvider %}

## keep

{% hooksApi keep %}

<p class="tip">The keep hook will remove any fields not specified even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), keep(...))`.</p>

{% hooksApiFieldNames keep "The only fields you want to keep in the record(s)." %}

- **Example**

  ```js
  const { keep } = require('feathers-hooks-common')

  module.exports = {
    after: {
      create: keep('name', 'dept', 'address.city')
    }
  }
  ```

- **Details**

  Update either `context.data` (before hook) or `context.result[.data]` (after hook).
  Their values are returned if they are not an object, so a `null` value is supported.

{% hooksApiFootnote keep %}

## keepInArray

{% hooksApi keepInArray %}

<p class="tip">The keepInArray hook will remove any fields not specified even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), keepInArray(...))`.</p>

- **Arguments**
  - `{String} arrayName`
  - `{Array< String >} fieldNames`

| Argument     | Type              | Default | Description                                                           |
| ------------ | ----------------- | ------- | --------------------------------------------------------------------- |
| `arrayName`  | `String`          |         | Field name containing an array of objects. Dot notation is supported. |
| `fieldNames` | `Array< String >` |         | Field names to keep in each object. Dot notation is supported.        |

- **Example**

  ```js
  const { keepInArray } = require('feathers-hooks-common')

  module.exports = {
    after: {
      create: keepInArray('users', ['name', 'dept', 'address.city']),
      find: keepInArray('account.users', ['name', 'dept', 'address.city'])
    }
  }
  ```

- **Details**

  Update either `context.data` (before hook) or `context.result[.data]` (after hook).
  Their values are returned if they are not an object, so a `null` value is supported.

{% hooksApiFootnote keepInArray %}

## keepQuery

{% hooksApi keepQuery %}

<p class="tip">The keepQuery hook will remove any fields not specified even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), keepQuery(...))`.</p>

{% hooksApiFieldNames keepQuery "The only fields you want to keep in the query object." %}

- **Example**

  ```js
  const { keepQuery } = require('feathers-hooks-common')

  module.exports = {
    after: {
      create: keepQuery('name', 'address.city')
    }
  }
  ```

- **Details**

  Updates `context.params.query`.

{% hooksApiFootnote keepQuery %}

## keepQueryInArray

{% hooksApi keepQueryInArray %}

<p class="tip">The keepQueryInArray hook will remove any fields not specified even if the service is being called from the server. You may want to condition the hook to run only for external transports, e.g. `iff(isProvider('external'), keepQueryInArray(...))`.</p>

{% hooksApiFieldNames keepQueryInArray "The only fields you want to keep in a nested array inside the query object." %}

- **Arguments**
  - `{String} arrayName`
  - `{Array< String >} fieldNames`

| Argument     | Type              | Default | Description                                                           |
| ------------ | ----------------- | ------- | --------------------------------------------------------------------- |
| `arrayName`  | `String`          |         | Field name containing an array of objects. Dot notation is supported. |
| `fieldNames` | `Array< String >` |         | Field names to keep in each object. Dot notation is supported.        |

- **Example**

  ```js
  const { keepQueryInArray } = require('feathers-hooks-common')

  module.exports = {
    before: {
      find: keepQueryInArray('$or', ['name', 'dept', 'address.city'])
    }
  }
  ```

- **Details**

  Updates `context.params.query`.
  Their values are returned if they are not an object, so a `null` value is supported.

{% hooksApiFootnote keepQueryInArray %}

## lowerCase

{% hooksApi lowerCase %}

{% hooksApiFieldNames keep "The fields in the record(s) whose values are converted to lower case." %}

- **Example**

  ```js
  const { lowerCase } = require('feathers-hooks-common')

  module.exports = {
    before: {
      create: lowerCase('email', 'username', 'div.dept')
    }
  }
  ```

- **Details**

  Update either `context.data` (before hook) or `context.result[.data]` (after hook).

{% hooksApiFootnote lowerCase %}

## mongoKeys

{% hooksApi mongoKeys %}

- **Arguments**

  - `{Function} ObjectID`
  - `{Array < String >} foreignKeyNames`

| Argument          |                  Type                   | Default | Description                                  |
| ----------------- | :-------------------------------------: | ------- | -------------------------------------------- |
| `ObjectID`        |               `Function`                | -       | `require('mongodb').ObjectID` or equivalent. |
| `foreignKeyNames` | `Array < String >` dot notation allowed | -       | Field names of the foreign keys.             |

- **Example**

  ```js
  const { ObjectID = require('mongodb');
  const { mongoKeys } = require('feathers-hooks-common');

  /* Comment Schema
  {
    _id,
    body,
    authorId,   // User creating this Comment
    postId,     // Comment is for this Post
    edit: {
      reason,
      editorId, // User last editing Comment
    )
  }
  */

  const foreignKeys = [
   '_id', 'authorId', 'postId', 'edit.editorId'
  ];

  module.exports = { before: {
    find: mongoKeys(ObjectID, foreignKeys)
  } };

  // Usage
  comment.find({ query: { postId: '111111111111' } })             // Get all Comments for the Post.
  comment.find({ query: { authorId: { $in: [...] } } })           // Get all Comments from these authors.
  comment.find({ query: { edit: { editorId: { $in: [...] } } } }) // Get all comments edited by these editors.
  ```

- **Details**

  In MongoDB, foreign keys must be wrapped in ObjectID when used in a query, e.g. `comment.find({ query: { authorId: new ObjectID('111111111111') } })`.

  `mongoKeys` automates this, given the field names of all the foreign keys in the schema. This reduces the boilerplate cluuter and reduces the chance of bugs occurring.

{% hooksApiFootnote mongoKeys %}

## paramsFromClient

{% hooksApi paramsFromClient %}

- **Arguments**

  - `{Array< String > | String} whitelist`

| Argument    |     Type     | Default | Description                                                                                                  |
| ----------- | :----------: | ------- | ------------------------------------------------------------------------------------------------------------ |
| `whitelist` | dot notation |         | Names of the props permitted to be in `context.params`. Other props are ignored. This is a security feature. |

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

{% hooksApiFootnote paramsFromClient %}

## populate

{% hooksApi populate %}

> `fastJoin` is preferred over using `populate`.

- **Arguments**

  - `{Object} options`

    - `{Object | Function} schema`

      - `{String} service`
      - `{any} [ permissions ]`
      - `{Array< Object > | Object} include`

        - `{String} service`
        - `{String} [ nameAs ]`
        - `{String} [ parentField ]`
        - `{String} [ childField]`
        - `{String} [ permissions ]`
        - `{Object} [ query ]`
        - `{Function} [ select ]`
        - `{Boolean} [ asArray ]`
        - `{Boolean | Number} [ paginate ]`
        - `{Boolean} [ useInnerPopulate ]`
        - `{undefined}} [ provider ]`
        - `{Array< Object > | Object} include`

          - ...

    - `{Function} [ checkPermissions ]`
    - `{Boolean} [ profile ]`

| Argument           | Type                | Default                      | Description                        |
| ------------------ | ------------------- | ---------------------------- | ---------------------------------- |
| `options`          | `Object`            |                              | Options.                           |
| `schema`           | `Object` `Function` | `(context, options)` `=> {}` | Info on how to join records.       |
| `checkPermissions` | `Function`          | no permission check          | Check if call allowed joins.       |
| `profile`          | `Boolean`           | `false`                      | If profile info is to be gathered. |

| `schema`           | Argument                             | Type                                       | Default                                                                                                                                                                                                                                               | Description |
| ------------------ | ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `service`          | `String`                             |                                            | The name of the service providing the items, actually its path.                                                                                                                                                                                       |
| `nameAs`           | dot notation                         | `service`                                  | Where to place the items from the join                                                                                                                                                                                                                |
| `parentField`      | dot notation                         |                                            | The name of the field in the parent item for the relation.                                                                                                                                                                                            |
| `childField`       | dot notation if database supports it |                                            | The name of the field in the child item for the relation. Dot notation is allowed and will result in a query like `{ 'name.first':` `'John' }` which is not suitable for all DBs. You may use query or select to create a query suitable for your DB. |
| `permissions`      | `any`                                | no permission check                        | Who is allowed to perform this join. See `checkPermissions` above.                                                                                                                                                                                    |
| `query`            | `Object`                             |                                            | An object to inject into `context.params.query`.                                                                                                                                                                                                      |
| `select`           | `Function`                           | `(context,` `parentItem,` `depth)` `=> {}` | A function whose result is injected into the query.                                                                                                                                                                                                   |
| `asArray`          | `Boolean`                            | `false`                                    | Force a single joined item to be stored as an array.                                                                                                                                                                                                  |
| `paginate`         | `Boolean` `Number`                   | `false`                                    | Controls pagination for this service.                                                                                                                                                                                                                 |
| `useInnerPopulate` | `Boolean`                            | `false`                                    | Perform any `populate` or `fastJoin` registered on this service.                                                                                                                                                                                      |
| `provider`         | `undefined`                          |                                            | Call the service as the server, not with the client's transport.                                                                                                                                                                                      |
| `include`          | `Array<` `Object >` or `Object`      |                                            | Continue recursively join records to these records.                                                                                                                                                                                                   |

> Read the [guide](guide.html#populate) for more information on the arguments.

- **Examples**

  - 1:1 relationship

  ```javascript
  // users like { _id: '111', name: 'John', roleId: '555' }
  // roles like { _id: '555', permissions: ['foo', bar'] }
  import { populate } from 'feathers-hooks-common'

  const userRoleSchema = {
    include: {
      service: 'roles',
      nameAs: 'role',
      parentField: 'roleId',
      childField: '_id'
    }
  }

  app.service('users').hooks({
    after: {
      all: populate({ schema: userRoleSchema })
    }
  })

  // result like
  // { _id: '111', name: 'John', roleId: '555',
  //   role: { _id: '555', permissions: ['foo', bar'] } }
  ```

  - 1:n relationship

  ```javascript
  // users like { _id: '111', name: 'John', roleIds: ['555', '666'] }
  // roles like { _id: '555', permissions: ['foo', 'bar'] }
  const userRolesSchema = {
    include: {
      service: 'roles',
      nameAs: 'roles',
      parentField: 'roleIds',
      childField: '_id'
    }
  }

  usersService.hooks({
    after: {
      all: populate({ schema: userRolesSchema })
    }
  })

  // result like
  // { _id: '111', name: 'John', roleIds: ['555', '666'], roles: [
  //   { _id: '555', permissions: ['foo', 'bar'] }
  //   { _id: '666', permissions: ['fiz', 'buz'] }
  // ]}
  ```

  - n:1 relationship

  ```javascript
  // posts like { _id: '111', body: '...' }
  // comments like { _id: '555', text: '...', postId: '111' }
  const postCommentsSchema = {
    include: {
      service: 'comments',
      nameAs: 'comments',
      parentField: '_id',
      childField: 'postId'
    }
  }

  postService.hooks({
    after: {
      all: populate({ schema: postCommentsSchema })
    }
  })

  // result like
  // { _id: '111', body: '...' }, comments: [
  //   { _id: '555', text: '...', postId: '111' }
  //   { _id: '666', text: '...', postId: '111' }
  // ]}
  ```

  - Multiple and recursive includes

  ```javascript
  const schema = {
    service: '...',
    permissions: '...',
    include: [
      {
        service: 'users',
        nameAs: 'authorItem',
        parentField: 'author',
        childField: 'id',
        include: [ ... ],
      },
      {
        service: 'comments',
        parentField: 'id',
        childField: 'postId',
        query: {
          $limit: 5,
          $select: ['title', 'content', 'postId'],
          $sort: {createdAt: -1}
        },
        select: (hook, parent, depth) => ({ $limit: 6 }),
        asArray: true,
        provider: undefined,
      },
      {
        service: 'users',
        permissions: '...',
        nameAs: 'readers',
        parentField: 'readers',
        childField: 'id'
      }
    ],
  };

  module.exports.after = {
    all: populate({ schema, checkPermissions, profile: true })
  };
  ```

  - Flexible relationship, similar to the n:1 relationship example above

  ```javascript
  // posts like { _id: '111', body: '...' }
  // comments like { _id: '555', text: '...', postId: '111' }
  const postCommentsSchema = {
    include: {
      service: 'comments',
      nameAs: 'comments',
      select: (hook, parentItem) => ({ postId: parentItem._id })
    }
  }

  postService.hooks({
    after: {
      all: populate({ schema: postCommentsSchema })
    }
  })

  // result like
  // { _id: '111', body: '...' }, comments: [
  //   { _id: '555', text: '...', postId: '111' }
  //   { _id: '666', text: '...', postId: '111' }
  // ]}
  ```

- **Details**

  We often want to combine rows from two or more tables based on a relationship between them. The `populate` hook will select records that have matching values in both tables.

  `populate` supports 1:1, 1:n and n:1 relationships. It can provide performance profile information.

{% hooksApiFootnote populate %}

## preventChanges

{% hooksApi preventChanges %}

- **Arguments**

  - `{Boolean} ifThrow`
  - `{Array < String >} fieldNames`

| Argument     |     Type     | Default | Description                                            |
| ------------ | :----------: | ------- | ------------------------------------------------------ |
| `ifThrow`    |  `Boolean`   |         | Deletes any `fieldNames` if `false`; throws if `true`. |
| `fieldNames` | dot notation |         | The fields names which may not be patched.             |

- **Example**

  ```js
  const { preventChanges } = require('feathers-hooks-common')

  module.exports = {
    before: {
      patch: preventChanges(true, 'security.badge')
    }
  }
  ```

- **Details**

  Consider using validateSchema if you would rather specify which fields are allowed to change.

{% hooksApiFootnote preventChanges %}

## required

{% hooksApi required %}

{% hooksApiFieldNames required "These fields must exist and not be falsey. Numeric 0 is acceptable." %}

- **Example**

  ```js
  const { required } = require('feathers-hooks-common')

  module.exports = {
    before: {
      all: required('email', 'password')
    }
  }
  ```

{% hooksApiFootnote required %}

## runParallel

{% hooksApi runParallel %}

- **Arguments**

  - `{Function} hookFunc`
  - `{Function} clone`
  - `{Number} [ depth ]`

| Argument   |    Type    | Default | Description                                                                                                         |
| ---------- | :--------: | :-----: | ------------------------------------------------------------------------------------------------------------------- |
| `hookFunc` | `Function` |         | The hook function to run in parallel to the rest of the service call.                                               |
| `clone`    | `Function` |         | Function to deep clone its only parameter.                                                                          |
| `depth`    |  `Number`  |    6    | Depth to which `context` is to be cloned. 0 does not clone. A depth of 5 would clone `context.result.data.[].item`. |

- **Example**

  ```js
  const { runParallel } = require('feathers-hooks-common');
  const clone = require('clone');

  function sendEmail(...) {
    return context => { ... };
  }

  module.exports = { after: {
    create: runParallel(sendEmail(...), clone)
  } };
  ```

- **Details**

  `hookFunc` is scheduled with a `setTimeout`. The next hook starts immediately.

  The hook was provided by bedeoverend. Thank you.

{% hooksApiFootnote runParallel %}

## serialize

{% hooksApi serialize %}

- **Arguments**
  - `{Object | Function} schema`
    - `{Array< String> | String} only`
    - `{Array< String> | String} exclude`
    - `[fieldName]: {Object} schema`
    - `{Object} computed`
      - `[fieldName]: {Function} computeFunc`

| Argument |        Type         | Default               | Description                 |
| -------- | :-----------------: | --------------------- | --------------------------- |
| `schema` | `Object` `Function` | `context` `=> schema` | How to serialize the items. |

| `schema`   | Argument                       | Type | Default                                                                                                                                      | Description |
| ---------- | ------------------------------ | :--: | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `only`     | `Array<` `String>` or `String` |      | The names of the fields to keep in each item. The names for included sets of items plus `_include` and `_elapsed` are not removed by `only`. |
| `exclude`  | `Array<` `String>` or `String` |      | The names of fields to drop in each item. You may drop, at your own risk, names of included sets of items, `_include` and `_elapsed`.        |
| `computed` | `Object`                       |      | The new names you want added and how to compute their values.                                                                                |

| `schema` `.computed` | Argument   |               Type               | Default                                                                                                                                                                                                                                                        | Description |
| -------------------- | ---------- | :------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `fieldName`          | `String`   |                                  | The name of the field to add to the records.                                                                                                                                                                                                                   |
| `computeFunnc`       | `Function` | `(record,` `context)` `=> value` | Function to calculate the computed value. `item`: The item with all its initial values, plus all of its included items. The function can still reference values which will be later removed by only and exclude. `context`: The context passed to `serialize`. |

- **Example**

  The schema reflects the structure of the populated records. The base records for this example have included `post` records, which themselves have included `authorItem`, `readersInfo` and `commentsInfo` records.

  ```js
  const schema = {
    only: 'updatedAt',
    computed: {
      commentsCount: (recommendation, hook) => recommendation.post.commentsInfo.length,
    },
    post: {
      exclude: ['id', 'createdAt', 'author', 'readers'],
      authorItem: {
        exclude: ['id', 'password', 'age'],
        computed: {
          isUnder18: (authorItem, hook) => authorItem.age < 18,
        },
      },
      readersInfo: {
        exclude: 'id',
      },
      commentsInfo: {
        only: ['title', 'content'],
        exclude: 'content',
      },
    },
  };
  purchaseOrders.after({
    all: [ populate( ... ), serialize(schema) ]
  });

  module.exports = { after: {
    get: [ populate( ... ), serialize(schema) ],
    find: [ fastJoin( ... ), serialize(schema) ]
  } };
  ```

- **Details**

  Works with <code>fastJoin</code> and <code>populate</code>.

{% hooksApiFootnote serialize %}

## setNow

{% hooksApi setNow %}

{% hooksApiFieldNames setNow "The fields that you want to add or set to the current date-time." %}

- **Example**

  ```js
  const { setNow } = require('feathers-hooks-common')

  module.exports = {
    before: {
      create: setNow('createdAt', 'updatedAt')
    }
  }
  ```

- **Details**

  Update either `context.data` (before hook) or `context.result[.data]` (after hook).

{% hooksApiFootnote setNow %}

## setSlug

{% hooksApi setSlug %}

- **Arguments**
  - `{String} slug`
  - `{String} [ fieldName ]`

| Argument    |   Type   | Default       | Description                                                                        |
| ----------- | :------: | ------------- | ---------------------------------------------------------------------------------- |
| `slug`      | `String` |               | The slug as it appears in the route, e.g. `storeId` for`/stores/:storeId/candies`. |
| `fieldName` | `String` | `query[slug]` | The field to contain the slug value.                                               |

- **Example**

  ```js
  const { setSlug } = require('feathers-hooks-common')

  module.exports = {
    before: {
      all: [hooks.setSlug('storeId')]
    }
  }

  // `context.params.query` will always be normalized,
  // e.g. `{ size: 'large', storeId: '123' }`
  ```

- **Details**

  A service may have a slug in its URL, e.g. `storeId` in `app.use(` `'/stores/:storeId/candies',` `new Service());`. The service gets slightly different values depending on the transport used by the client.

| transport | `hook.data` `.storeId` | `hook.params` `.query`                | code run on client                                                                           |
| --------- | ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| socketio  | `undefined`            | `{ size: 'large',` `storeId: '123' }` | `candies.create({ name: 'Gummi',qty: 100 },` `{ query: { size: 'large', storeId: '123' } })` |
| rest      | `:storeId`             | same as above                         | same as above                                                                                |
| raw HTTP  | `123`                  | `{ size: 'large' }`                   | `fetch('/stores/123/candies?size=large', ..`                                                 |

This hook normalizes the difference between the transports.

{% hooksApiFootnote setSlug %}

## sifter

{% hooksApi sifter %}

- **Arguments**

  - `{Function} siftFunc`

| Argument   |    Type    | Default | Description                                                                                                                                                    |
| ---------- | :--------: | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `siftFunc` | `Function` |         | Function similar to `context => sift(mongoQueryObj)`. Information about the mongoQueryObj syntax is available at [crcn/sift](https://github.com/crcn/sift.js). |

- **Example**

  ```js
  const sift = require('sift')
  const { sifter } = require('feathers-hooks-common')

  const selectCountry = hook => sift({ 'address.country': hook.params.country })

  module.exports = {
    before: {
      find: sifter(selectCountry)
    }
  }
  ```

  ```js
  const sift = require('sift')
  const { sifter } = require('feathers-hooks-common')

  const selectCountry = country => () => sift({ address: { country: country } })

  module.exports = {
    before: {
      find: sifter(selectCountry('Canada'))
    }
  }
  ```

- **Details**

  All official Feathers database adapters support a common way for querying, sorting, limiting and selecting find method calls. These are limited to what is commonly supported by all the databases.

  The `sifter` hook provides an extensive MongoDB-like selection capabilities, and it may be used to more extensively select records.

  `sifter` filters the result of a find call. Therefore more records will be physically read than needed. You can use the Feathers database adapters query to reduce this number.`

{% hooksApiFootnote sifter %}

## skipRemainingHooks

{% hooksApi skipRemainingHooks %}

  <p class="tip">The service call will only be skipped if `context.result` has been set manually.</p>

- **Arguments**

  - `{Function | Boolean} predicate`

| Argument    |         Type          | Default                     | Description                                                                                                |
| ----------- | :-------------------: | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `predicate` | `Function`, `Boolean` | `content => content.result` | A predicate. If true the remaining hooks are skipped. The default checks if `context.result` has been set. |

- **Example**

  Skip the remaining hooks if the record was found in the cache.

  ```js
  const { cache, skipRemainingHooks } = require('feathers-hooks-common')

  module.exports = {
    before: {
      get: [cache(new Map()), skipRemainingHooks()]
    }
  }
  ```

  Skip all the `after` hooks if the service call was initiated by the server.

  ```js
  module.exports = {
    after: {
      all: [skipRemainingHooks(context => !context.provider)]
    }
  }
  ```

- **Details**

  The remaining before hooks will be skipped is you use `shipRemainingHooks` as a before hook. However the after hooks will still be run.

  `shipRemainingHooks` skips the remaining hooks in the before, after or error hooks. It will skip the remaining hooks if used within the `combine` hook.

{% hooksApiFootnote skipRemainingHooks %}

## softDelete

  <p class="tip">DEPRECATED. Use the **softDelete2** hook instead. It is a noteable improvement over softDelete.</p>

{% hooksApi softDelete %}

  <p class="tip">The softDelete2 hooks must be correctly positioned.</p>

- **Arguments**
  - `{String} fieldName`

| Argument    |   Type   | Default     | Description                                           |
| ----------- | :------: | ----------- | ----------------------------------------------------- |
| `fieldName` | `String` | `'deleted'` | The name of the field for the logically deleted flag. |

- **Example**

  ```js
  const { softDelete } = require('feathers-hooks-common');
  const dept = app.service('departments');

  module.exports = { before: {
    all: softDelete(),
  } };

  // will throw if item is marked deleted.
  dept.get(0).then(...)

  // methods can be run avoiding softDelete handling
  dept.get(0, { query: { $disableSoftDelete: true }}).then(...)
  ```

- **Detail**

  Marks items as `{ deleted: true }` instead of physically removing them. This is useful when you want to discontinue use of, say, a department, but you have historical information which continues to refer to the discontinued department.

  The hook performs its own preliminary `get` call if the original service call was not itself a `get`. The calling params for this prelinary `get` are formed from the original calling context:

  ```js
  { query: {},
    provider: context.params.provider, // Keep the same transport.
    _populate: 'skip', // Skip any `fastJoin` or `populate` hooks.
    authenticated: context.params.authenticated, // Keep authentication status.
    user: context.params.user // Keep authenticated user information
  }
  ```

  <p class="tip">The `user` record is read by feathers-authentication` with a `get`. The `softDelete` hook will be run for this call unless it is conditioned to ignore it. This situation raises the most issues for this hook.</p>

  <p class="tip">The hook will not function properly if you remove the `deleted` flag in your hooks. It has to returned in the record.</p>

{% hooksApiFootnote softDelete %}

## softDelete2

{% hooksApi softDelete2 %}

  <p class="tip">softDelete2 must be correctly positioned as both a before and an after hook. Refer to the **Details** section and the **Examples**.</p>

- **Arguments**
  - `{Object} options`

| Argument  |   Type   | Default | Description                                                                                                    |
| --------- | :------: | ------- | -------------------------------------------------------------------------------------------------------------- |
| `options` | `Object` | `{}`    | The options for the hook. The allowed options differ depending on whether the hook is used in before or after. |

When used as a before hook:

| `options`                 | Argument   | Type             | Default                                                                                                                                                                                                                                                                                                                                                                             | Description |
| ------------------------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `deletedAt`               | `String`   | `'deletedAt'`    | The prop name whose value is the time stamp when the record was logically deleted. `Date.now()` is used as the time stamp.                                                                                                                                                                                                                                                          |
| `keepOnCreate`            | `Boolean`  | `false`          | The prop `deletedAt` is set to -1 when a record is created. An option value of `true` will retain the existing value of `deletedAt` if one is provided. This is useful when loading a dataset with records.                                                                                                                                                                         |
| `skipProbeOnGet`          | `Boolean`  | `false`          | softDelete2 makes a probing `get` call to determine if a record is active before mutating it. It makes this probing call even for a `get` call, though that's redundant. An option value of `true` results in a single `get` call, improving performance. This however may cause unexpected interactions with other hooks which is why performing the probing call is the default.  |
| `allowIgnore` `DeletedAt` | `Boolean`  | `true`           | Your app usually has to access records even if they are logically deleted. softDelete2 acts like a no-op for calls with `params.$ignoreDeletedAt: true`. Clients can be prevented from using this with the `paramsFromClient` hook. If you consider it a security issue that server code is allowed to do this, an option value of `false` disables this capability in softDelete2. |
| `probeCall`               | `Function` | built-in default | A custom function to perform the probing get call. Its signature is `(context, options)` where `options` is these options.)                                                                                                                                                                                                                                                         |
| `patchCall`               | `Function` | built-in default | A custom function to perform the patch call which marks the record as deleted. Its signature is `(context, options)` where `options` is these options.)                                                                                                                                                                                                                             |

When used as an after hook:

| `options`                 | Argument  | Type          | Default                                                                     | Description |
| ------------------------- | --------- | ------------- | --------------------------------------------------------------------------- | ----------- |
| `deletedAt`               | `String`  | `'deletedAt'` | It must be specified in the after hook if its specified in the before hook. |
| `skipProbeOnGet`          | `Boolean` | `false`       | It must be specified in the after hook if its specified in the before hook. |
| `allowIgnore` `DeletedAt` | `Boolean` | `true`        | It must be specified in the after hook if its specified in the before hook. |

- **Examples**

Usage without authentication:

```js
// On server
const { softDelete2 } = require('feathers-hooks-common');
const posts = app.service('posts');

module.exports = {
  before: {
    all: softDelete2()
  },
  after:
    all: softDelete2()
  }
};

// will throw if item is marked deleted.
const rec = await posts.get(0);

// methods can be run avoiding softDelete handling
const rec = await posts.get(0, { $ignoreDeletedAt: true });
```

Usage with authentication:

```js
// On server
const { authenticate } = require('@feathersjs/authentication').hooks
const {
  hashPassword,
  protect
} = require('@feathersjs/authentication-local').hooks
const { restrictToOwner } = require('feathers-authentication-hooks')
const { softDelete2, paramsFromClient } = require('feathers-hooks-common')

const users = app.service('users')
const posts = app.service('posts')

users.hooks({
  before: {
    all: [],
    find: [authenticate('jwt'), softDelete2()],
    get: [authenticate('jwt'), softDelete2()],
    create: [hashPassword(), authenticate('jwt'), softDelete2()],
    update: [hashPassword(), authenticate('jwt'), softDelete2()],
    patch: [hashPassword(), authenticate('jwt'), softDelete2()],
    remove: [authenticate('jwt'), softDelete2()]
  },
  after: {
    all: [
      protect('password'),
      softDelete2()
    ] /* Must always be the last 2 hooks */
  }
})

posts.hooks({
  before: {
    all: [paramsFromClient('$ignoreDeletedAt'), authenticate('jwt')],
    get: [
      softDelete2(),
      restrictToOwner({ idField: 'id', ownerField: 'ownerId' })
    ],
    create: [
      softDelete2(),
      restrictToOwner({ idField: 'id', ownerField: 'ownerId' })
    ],
    update: [
      softDelete2(),
      restrictToOwner({ idField: 'id', ownerField: 'ownerId' })
    ],
    patch: [
      softDelete2(),
      restrictToOwner({ idField: 'id', ownerField: 'ownerId' })
    ],
    remove: [
      restrictToOwner({ idField: 'id', ownerField: 'ownerId' }),
      softDelete2()
    ]
  },
  after: {
    all: softDelete2()
  }
})

// On client
const {
  paramsForServer
} = require('feathers-hooks-common/lib/services/params-for-server')

await app.authenticate({
  strategy: 'local',
  email: 'foo@gmail.com',
  password: 'bar'
})

const posts = app.service('posts')

// will throw if item is marked deleted.
const rec1 = await posts.get(0)

// methods can be run avoiding softDelete handling
const rec2 = await posts.get(0, paramsForServer({ $ignoreDeletedAt: true }))
```

- **Detail**

  softDelete2 makes a probing get call to check if a record is logically deleted before allowing it to be accessed or mutated. It also replaces remove calls with ones to patch `deletedAt: Date.now()` into the record.

  Find calls, plus patch or remove calls with a `null` id, do not need a probing get. softDelete2 modifies their `params.query` to ignore logically deleted records.

- **An issue with hooks**

  As mentioned, softDelete2 makes get and patch calls. You may want to use the authentication hook `restrictToOwner`, but that makes its own version of a probing get call. Other hooks, such as `stashBefore`, also make get calls.

  A problem may arise because all such calls run the hooks associated with that call. Let's say, for example, the hooks on your get method include `fastJoin`. The `restrictToOwner` probing get call will run the `fastJoin` on its probing get call, degrading performance significantly. You have to find ways of explicitly disabling hooks like `fastJoin`.

  Even worse, the nested running of such hooks can create incompatibilities resulting in errors.

- **How softDelete2 controls hooks**

  softDelete2 is run for every call on a service, so its careful to not run unnecessary hooks during its probing get and removal patch calls. The hooks following the before `softDelete2()` are skipped, as are those following the after `softDelete2()`. _This skipping occurs only for the probing get and removal patch calls. All hooks are executed for the original call._

  In the example below:

  - The hooks21 & hooks41 hooks on get and patch are run during the probing get and removing patch.
  - The hooks22 & hooks42 hooks are not run during those calls.
  - So on an update: hooks31 (for update), hooks21 (probing get), hooks32 (for update) are run.
  - So on a remove: hooks51 (for remove), hooks21 (probing get), hooks41 (removal patch) are run.

  ```js
  module.exports = {
    before: {
      find: [...hooks01, softDelete(), ...hooks02],
      create: [...hooks11, softDelete(), ...hooks12],
      get: [...hooks21, softDelete(), ...hooks22],
      update: [...hooks31, softDelete(), ...hooks32],
      patch: [...hooks41, softDelete(), ...hooks42],
      remove: [...hooks51, softDelete()] // softDelete must be the last hook run for remove calls.
    },
    after: {
      all: softDelete2() // Must be the first hook run for get or patch calls.
    }
  }
  ```

- **options.allowIgnoreDeletedAt**

  softDelete2 will allow access to logically deleted records if the call's params includes `$ignoreDeletedAt: true` while options.allowIgnoreDeletedAt is `true` (the default). Be careful setting it to `false` as not even server calls will be able to read logically deleted records.

  You can prevent just client calls from using `$ignoreDeletedAt: true` by not specifying `$ignoreDeletedAt` in the [`paramsFromClient`](#paramsFromClient) hook.

  You may need to prevent other hooks from running as well. You can use code similar to

  ```js
  iff(context => !context.params.$ignoreDeletedAt, restrictToOwner(...))
  ```

- **options.probeCall**

  The default probing get call function is

  ```js
  const {
    callingParams,
    callingParamsDefault
  } = require('feathers-hooks-common')

  async function defaultProbeCall(context, options) {
    const params = callingParams({
      newProps: { provider: undefined },
      hooksToDisable: ['softDelete2']
    })(context)

    return context.service.get(context.id, params)
  }
  ```

  where `options` is the options provided softDelete2. Its resulting params will be:

  ```js
  params = {
    authenticated: context.params.authenticated,
    user: context.params.user,
    provider: undefined,
    $disableSoftDelete2: true
  }
  ```

  You can change the params produced by the default function by calling [`callingParamsDefaults`](#callingparamsdefaults). You can instead provide your own probing call function using options.probeCall.

- **options.patchCall**

  The default function to perform the patch call which marks the record as deleted is

  ```js
  const {
    callingParams,
    callingParamsDefault
  } = require('feathers-hooks-common')

  async function defaultPatchCall(context, options) {
    const deletedAt = options.deletedAt || defaultDeletedAt

    const params = callingParams({
      query: Object.assign({}, context.params.query, { [deletedAt]: -1 }),
      newProps: { provider: undefined },
      hooksToDisable: ['softDelete2']
    })(context)

    return context.service.patch(
      context.id,
      { [deletedAt]: Date.now() },
      params
    )
  }
  ```

  where `options` is the options provided softDelete2. Its resulting params will be:

  ```js
  params = {
    query: { ..., deletedAt: -1 },
    authenticated: context.params.authenticated,
    user: context.params.user,
    provider: undefined,
    $disableSoftDelete2: true
  };
  ```

  You can change the params produced by the default function by calling [`callingParamsDefaults`](#callingparamsdefaults). You can instead provide your own probing call function using options.patchCall.

{% hooksApiFootnote softDelete2 %}

## some

{% hooksApi some %}

- **Arguments**

  - `{Array< Function >} predicates`

| Argument     |        Type         | Default | Description                                                                   |
| ------------ | :-----------------: | ------- | ----------------------------------------------------------------------------- |
| `predicates` | `Array< Function >` |         | Functions which take the current hook as a param and return a boolean result. |

{% hooksApiReturns some "The logical or of <code>predicates</code>" %}

- **Example**

  ```js
  const { iff, some } = require('feathers-hooks-common');

  module.exports = { before: {
      create: iff(some(hook1, hook2, ...), hookA, hookB, ...)
  } };
  ```

- **Details**

  `some` is a predicate function for use in conditional hooks. The predicate functions are run in parallel, and `true` is returned if any predicate returns a truthy value.

{% hooksApiFootnote some %}

## stashBefore

{% hooksApi stashBefore %}

- **Arguments**
  - `{String} fieldName`

| Argument    | Type | Default    | Description                                                                    |
| ----------- | :--: | ---------- | ------------------------------------------------------------------------------ |
| `fieldName` |      | `'before'` | The name of the `context.params` property to contain the current record value. |

- **Example**

  ```js
  const { patch } = require('feathers-hooks-common')

  module.exports = {
    before: {
      patch: stashBefore()
    }
  }
  ```

- **Details**

  The hook performs its own preliminary `get` call. If the original service call is also a `get`, its `context.params` is used for the preliminary `get`.  The preliminary `get` will be skipped if `params.disableStashBefore` is truthy.

  For any other method the calling params are formed from the original calling context:

  ```js
  { provider: context.params.provider,
    authenticated: context.params.authenticated,
    user: context.params.user }
  ```

{% hooksApiFootnote stashBefore %}

## traverse

{% hooksApi traverse %}

- **Arguments**
  - `{Function} transformer`
  - `{Function} [ getObject ]`

| Argument      |    Type    | Default                                   | Description                                                                   |
| ------------- | :--------: | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `transformer` | `Function` |                                           | Called for every node in every record(s). May change the node in place.       |
| `getObject`   | `Function` | `context.data` or `context.result[.data]` | Function with signature `context => {}` which returns the object to traverse. |

- **Example**

  ```js
  const { traverse } = require('feathers-hooks-common')

  // Trim strings
  const trimmer = function(node) {
    if (typeof node === 'string') {
      this.update(node.trim())
    }
  }

  // REST HTTP request may use the string 'null' in its query string.
  // Replace these strings with the value null.
  const nuller = function(node) {
    if (node === 'null') {
      this.update(null)
    }
  }

  module.exports = {
    before: {
      create: traverse(trimmer),
      find: traverse(nuller, context => context.params.query)
    }
  }
  ```

- **Details**

  Traverse and transform objects in place by visiting every node on a recursive walk. Any object in the hook may be traversed, including the query object.

  > [substack/js-traverse](https://github.com/substack/js-traverse) documents the extensive methods and context available to the transformer function.

{% hooksApiFootnote traverse %}

## unless

{% hooksApi unless %}

- **Arguments**
  - `{Boolean | Promise | Function} predicate`
  - `{Array< Function >} hookFuncs`

| Argument    |                Type                | Default | Description                                                                                                                                                                             |
| ----------- | :--------------------------------: | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `predicate` | `Boolean`, `Promise` or `Function` |         | Run `hookFunc` if the `predicate` is false. If a function, `predicate` is called with the `context` as its param. It returns either a boolean or a Promise that evaluates to a boolean. |
| `hookFuncs` |       `Array<` `Function >`        |         | Sync or async hook functions to run if `true`. They may include other conditional hooks.                                                                                                |

- **Example**

  ```js
  const { isProvider, unless } = require('feathers-hooks-common')

  module.exports = {
    before: {
      create: unless(
        isProvider('server'),
        hookA,
        unless(isProvider('rest'), hook1, hook2, hook3),
        hookB
      )
    }
  }
  ```

- **Details**

  Resolve the predicate to a boolean. Run the hooks sequentially if the result is falsey.

  The predicate and hook functions will not be called with `this` set to the service, as is normal for hook functions. Use `hook.service` instead.

{% hooksApiFootnote unless %}

## validate

{% hooksApi validate %}

- **Arguments**

  - `{Function} validator`

| Argument    |    Type    | Default | Description                              |
| ----------- | :--------: | ------- | ---------------------------------------- |
| `validator` | `Function` |         | Validation function. See Details below.. |

- **Example**

  ```js
  const { validate } = require('feathers-hooks-common')
  const { promisify } = require('util')

  // function myCallbackValidator(values, cb) { ... }
  const myValidator = promisify(myCallbackValidator)

  module.exports = {
    before: {
      create: validate(myValidator)
    }
  }
  ```

- **Details**

  The validation function may be sync or return a Promise. Sync functions return either an error object like `{ fieldName1: 'message', ... }` or `null`. They may also throw with `throw new errors.BadRequest({ errors: errors });`.

  Promise functions should throw on an error or reject with `new errors.BadRequest('Error message', { errors: { fieldName1: 'message', ... } });`. Their `.then` returns either sanitized values to replace `context.data`, or `null`.

  The validator's parameters are

  - `{Object} formValues`
  - `{Object} context`

  Sync functions return either an error object like `{ fieldName1: 'message', ... }` or `null`. `Validate` will throw on an error object with `throw new errors.BadRequest({ errors: errorObject });`.

  - `{Object | null} errors`

| Argument     |      Type       | Default | Description                                           |
| ------------ | :-------------: | ------- | ----------------------------------------------------- |
| `formValues` |    `Object`     |         | The data, e.g. `{ name: 'John', ... }`                |
| `context`    |    `Object`     |         | The hook context.                                     |
| `errors`     | `Object` `null` |         | An error object like `{ fieldName1: 'message', ... }` |

> If you have a different signature for the validator then pass a wrapper as the validator e.g. `values => myValidator(..., values, ...)`.

> Wrap your validator in Node's `util.promisify` if it uses a callback.

{% hooksApiFootnote validate %}

## validateSchema

{% hooksApi validateSchema %}

- **Arguments**
  - `{Object} schema`
  - `{Function | Object} ajv`
  - `{Object} options`
    - `{Function} [ addNewError ]`
    - `...`

| Argument  |        Type         | Default | Description                                                                                                |
| --------- | :-----------------: | ------- | ---------------------------------------------------------------------------------------------------------- |
| `schema`  |      `Object`       |         | The [JSON-schema.](https://code.tutsplus.com/tutorials/validating-data-with-json-schema-part-1--cms-25343) |
| `ajv`     | `Function` `Object` |         | The ajv validator. Could be either the Ajv constructor or an instance of it.                               |
| `options` |      `Object`       |         | Options for `validateSchema` and `ajv`.                                                                    |

| `options`     | Argument   |   Type    | Default                                                                               | Description |
| ------------- | ---------- | :-------: | ------------------------------------------------------------------------------------- | ----------- |
| `addNewError` | `Function` | see below | Custom error message formatter.                                                       |
| other         | `any`      |           | Any `ajv` options. Only effective when the second parameter is the `Ajv` constructor. |

- **Example**

  ```js
  const Ajv = require('ajv')
  const createSchema = {
    /* JSON-Schema */
  }

  module.before({
    create: validateSchema(createSchema, Ajv)
  })
  ```

  ```js
  const Ajv = require('ajv')
  const ajv = new Ajv({ allErrors: true, $data: true })

  ajv.addFormat('allNumbers', '^d+$')
  const createSchema = {
    /* JSON-Schema */
  }

  module.before({
    create: validateSchema(createSchema, ajv)
  })
  ```

- **Details**

  There are some good [tutorials](https://code.tutsplus.com/tutorials/validating-data-with-json-schema-part-1--cms-25343) on using JSON-Schema with [Ajv](https://github.com/epoberezkin/ajv).

  If you need to customize `Ajv` with new keywords, formats or schemas, then instead of passing the `Ajv` constructor, you may pass in an instance of `Ajv` as the second parameter. In this case you need to pass `Ajv` options to the `Ajv` instance when `new`ing, rather than passing them in the third parameter of `validateSchema`. See the examples.

- **options.addNewError**

  The hook will throw if the data does not match the JSON-Schema. `error.errors` will, by default, contain an array of error messages. You may change this with a custom formatting function. Its a reducing function which works similarly to `Array.reduce()`. Its parameters are

  - `{any} currentFormattedMessages`
  - `{Object} ajvErrorObject`
  - `{Number} itemsLen`
  - `{Number} index`

  It returns

  - `{any} newFormattedMessages`

| Argument                   |   Type   | Default          | Description                                                          |
| -------------------------- | :------: | ---------------- | -------------------------------------------------------------------- |
| `currentFormattedMessages` |  `any`   | initially `null` | Formatted messages so far. Initially null.                           |
| `ajvErrorObject`           | `Object` |                  | [ajv error object](https://github.com/epoberezkin/ajv#error-objects) |
| `itemsLen`                 | `Number` |                  | How many data items there are. 1-based.                              |
| `item`                     | `Number` |                  | Which item this is. 0-based.                                         |
| `newFormattedMessages`     |  `any`   |                  | The function returns the updated formatted messages.                 |

`error.errors` will, by default, contain an array of error messages. By default the message will look like

```js
;[
  '\'in row 1 of 3, first\' should match format "startWithJo"',
  "in row 1 of 3, should have required property 'last'",
  '\'in row 2 of 3, first\' should match format "startWithJo"',
  "in row 3 of 3, should have required property 'last'"
]
```

> You could, for example, return `{ name1: message, name2: message }` which might be more suitable for a UI.

- **Internationalization of Messages**

  You can consider using [ajv-i18n](https://github.com/epoberezkin/ajv-i18n), together with ajv's `messages` option, to internationalize your error messages.

  You can also consider copying `addNewErrorDflt`, the default error message formatter, modifying it for your needs, and using that as `newFormattedMessages`.

{% hooksApiFootnote validateSchema %}

## when

An alias for [iff](#iff).

{% hooksApiFootnote when %}
