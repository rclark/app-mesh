'use strict';

const ajv = new require('ajv')(({ allErrors: true, verbose: true }));
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

module.exports = (schema, data) => {
  if (ajv.validate(schema, data)) return;

  const errors = ajv.errors.map((e) => `${e.dataPath ? e.dataPath + ' ' : ''}${e.message}`);
  throw new Error(errors.join(', '));
};
