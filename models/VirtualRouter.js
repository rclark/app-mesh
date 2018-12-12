'use strict';

const client = require('../lib/client');
const validate = require('../lib/validate');
const specs = require('../lib/specs');

class VirtualRouter {
  constructor({
    meshName,
    virtualRouterName,
    region = 'us-east-1'
  } = {}) {
    this.meshName = meshName;
    this.virtualRouterName = virtualRouterName;
    this.region = region;
    this._description = {};
  }

  get client() { return client.get(this.region); }
  get metadata() { return this._description.metadata; }
  get status() { return this._description.status; }
  get arn() { return this._description.metadata.arn; }

  get spec() { return this._description.spec; }
  set spec({ serviceNames }) {
    validate(specs.virtualRouter, { serviceNames });
    this._description.spec = { serviceNames };
  }

  async exists() {
    return await VirtualRouter
      .list({ meshName: this.meshName, region: this.region })
      .then((virtualRouters) => virtualRouters.find(
        (virtualRouter) => virtualRouter.virtualRouterName === this.virtualRouterName
      ))
      .then((virtualRouter) => !!virtualRouter);
  }

  async create() {
    if (await this.exists()) await this.read();

    else this._description = await this.client
      .createVirtualRouter({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        spec: this.spec
      })
      .promise()
      .then((data) => data.virtualRouter);

    return this;
  }

  async read() {
    this._description = await this.client
      .describeVirtualRouter({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName
      })
      .promise()
      .then((data) => data.virtualRouter);

    return this;
  }

  async update() {
    this._description = await this.client
      .updateVirtualRouter({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        spec: this._description.spec
      })
      .promise()
      .then((data) => data.virtualRouter);

    return this;
  }

  async delete() {
    this._description = await this.client
      .deleteVirtualRouter({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName
      })
      .promise();

    return this;
  }

  static async list({
    meshName,
    region
  }) {
    return new Promise((resolve, reject) => {
      const virtualRouters = [];

      client.get(region)
        .listVirtualRouters({ meshName })
        .eachPage((err, data, done) => {
          if (err) return reject(err);
          if (!data) return resolve(virtualRouters);

          data.virtualRouters.forEach((v) => {
            const virtualRouter = new VirtualRouter({ meshName, virtualRouterName: v.virtualRouterName });
            virtualRouter._description.metadata = { arn: v.arn };
            virtualRouters.push(virtualRouter);
          });

          done();
        });
    });
  }
}

module.exports = VirtualRouter;
