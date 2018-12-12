'use strict';

const client = require('../lib/client');
const validate = require('../lib/validate');
const specs = require('../lib/specs');

class Route {
  constructor({
    meshName,
    virtualRouterName,
    routeName,
    region = 'us-east-1'
  }) {
    this.meshName = meshName;
    this.virtualRouterName = virtualRouterName;
    this.routeName = routeName;
    this.region = region;
    this._description = {};
  }

  get client() { return client.get(this.region); }
  get metadata() { return this._description.metadata; }
  get status() { return this._description.status; }
  get arn() { return this._description.metadata.arn; }

  get spec() { return this._description.spec; }
  set spec({ httpRoute }) {
    validate(specs.route, { httpRoute });
    this._description.spec = { httpRoute };
  }

  async exists() {
    return await Route
      .list({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        region: this.region
      })
      .then((routes) => routes.find(
        (route) => route.routerName === this.routeName
      ))
      .then((route) => !!route);
  }

  async create() {
    if (await this.exists()) await this.read();

    else this._description = await this.client
      .createRoute({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        routeName: this.routeName,
        spec: this.spec
      })
      .promise()
      .then((data) => data.route);

    return this;
  }

  async read() {
    this._description = await this.client
      .describeRoute({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        routeName: this.routeName
      })
      .promise()
      .then((data) => data.route);

    return this;
  }

  async update() {
    this._description = await this.client
      .updateRoute({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        routeName: this.routeName,
        spec: this._description.spec
      })
      .promise()
      .then((data) => data.route);

    return this;
  }

  async delete() {
    this._description = await this.client
      .deleteRoute({
        meshName: this.meshName,
        virtualRouterName: this.virtualRouterName,
        routeName: this.routeName
      })
      .promise();

    return this;
  }

  static async list({
    meshName,
    virtualRouterName,
    region
  }) {
    return new Promise((resolve, reject) => {
      const routes = [];

      client.get(region)
        .listRoutes({ meshName, virtualRouterName })
        .eachPage((err, data, done) => {
          if (err) return reject(err);
          if (!data) return resolve(routes);

          data.routes.forEach((r) => {
            const virtualNode = new Route({
              meshName,
              virtualRouterName,
              routeName: r.routeName
            });
            virtualNode._description.metadata = { arn: r.arn };
            routes.push(virtualNode);
          });

          done();
        });
    });
  }
}

module.exports = Route;
