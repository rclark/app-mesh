'use strict';

const AWS = require('aws-sdk');

let shared;

module.exports = {
  get: (region = 'us-east-1') => {
    if (shared) return shared;

    const options = { region };
    if (process.env.DEBUG) options.logger = console;

    shared = new AWS.AppMesh(options);

    return shared;
  },

  reset: () => shared = undefined
};
