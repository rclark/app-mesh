'use strict';

module.exports = {
  virtualNode: {
    type: 'object',
    additionalProperties: false,
    properties: {
      backends: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' }
      },
      listeners: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            healthcheck: {
              type: 'object',
              additionalProperties: false,
              properties: {
                healthyThreshold: { type: 'integer' },
                intervalMillis: { type: 'integer' },
                path: { type: 'string' },
                protocol: { enum: ['http', 'tcp'] },
                timeoutMillis: { type: 'integer' },
                unhealthyThreshold: { type: 'integer' }
              }
            },
            portMapping: {
              type: 'object',
              additionalProperties: false,
              properties: {
                port: { type: 'integer' },
                protocol: { enum: ['http', 'tcp'] }
              }
            }
          }
        }
      },
      serviceDiscovery: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dns: {
            type: 'object',
            additionalProperties: false,
            properties: {
              serviceName: { type: 'string' }
            }
          }
        }
      }
    }
  },

  virtualRouter: {
    type: 'object',
    additionalProperties: false,
    properties: {
      serviceNames: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' }
      }
    }
  },

  route: {
    type: 'object',
    additionalProperties: false,
    properties: {
      httpRoute: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: {
            type: 'object',
            additionalProperties: false,
            properties: {
              weightedTargets: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    virtualNode: { type: 'string' },
                    weight: { type: 'integer' }
                  }
                }
              }
            }
          },
          match: {
            type: 'object',
            additionalProperties: false,
            properties: {
              prefix: { pattern: '^/.*$' }
            }
          }
        }
      }
    }
  }
};
