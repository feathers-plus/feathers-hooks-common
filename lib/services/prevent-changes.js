const existsByDot = require('lodash/has');
const omit = require('lodash/omit');

const checkContext = require('./check-context');
const errors = require('@feathersjs/errors');

module.exports = function (...fieldNames) {
  const ifThrow = fieldNames[0];

  if (typeof ifThrow === 'string') {
    console.log('**Deprecated** Use the preventChanges(true, ...fieldNames) syntax instead.');
  } else {
    fieldNames = fieldNames.slice(1);
  }

  return context => {
    checkContext(context, 'before', ['patch'], 'preventChanges');
    const data = context.data;

    fieldNames.forEach(name => {
      if (existsByDot(data, name)) {
        if (ifThrow) {
          throw new errors.BadRequest(`Field ${name} may not be patched. (preventChanges)`);
        }
        // Delete data.contactPerson.name
        context.data = omit(data, name);
      }
      // Delete data['contactPerson.name']
      if (data.hasOwnProperty(name)) {
        if (ifThrow) throw new errors.BadRequest(`Field ${name} may not be patched. (preventChanges)`);
        delete data[name];
      }
    });

    return context;
  };
};
