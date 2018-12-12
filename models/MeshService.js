'use strict';

const VirtualRouter = require('./VirtualRouter');
const VirtualNode = require('./VirtualNode');
const Route = require('./Route');

class MeshService {
  constructor({
    meshName,
    logicalName,
    serviceNames,
    region = 'us-east-1'
  } = {}) {
    this.meshName = meshName;
    this.logicalName = logicalName;
    this.serviceNames = serviceNames;
    this.region = region;

    this.router = new VirtualRouter({
      meshName,
      virtualRouterName: logicalName,
      region
    });
    this.router.spec = { serviceNames };

    this._nodes = [];
    this._routes = [];
  }

  get nodes() { return this._nodes; }
  get routes() { return this._routes; }

  putNode({ logicalName, backends, portMappings, dnsName } = {}) {
    const virtualNode = new VirtualNode({
      meshName: this.meshName,
      virtualNodeName: logicalName,
      region: this.region
    });

    virtualNode.spec = {
      backends,
      listeners: portMappings.map((portMapping) => ({ portMapping })),
      serviceDiscovery: { dns: { serviceName: dnsName } }
    };

    this.removeNode(logicalName);
    this._nodes.push(virtualNode);

    return virtualNode;
  }

  removeNode(logicalName) {
    this._nodes = this._nodes.filter(
      (node) => node.virtualNodeName !== logicalName
    );
  }

  putRoute({ logicalName, pathPrefix, targets = {} } = {}) {
    const route = new Route({
      meshName: this.meshName,
      virtualRouterName: this.router.virtualRouterName,
      routeName: logicalName,
      region: this.region
    });

    route.spec = {
      httpRoute: {
        match: { prefix: pathPrefix },
        action: {
          weightedTargets: targets.map(
            ({ node, weight }) => ({ virtualNode: node.virtualNodeName, weight })
          )
        }
      }
    };

    this.removeRoute(logicalName);
    this._routes.push(route);

    return route;
  }

  removeRoute(logicalName) {
    this._routes = this._routes.filter(
      (route) => route.routeName !== logicalName
    );
  }

  async exists() {
    return await this.router.exists();
  }

  async create() {
    if (await this.exists()) await this.read();

    else {
      await this.router.create();
      await Promise.all(this.nodes.map((node) => node.create()));
      await Promise.all(this.routes.map((route) => route.create()));
    }

    return this;
  }

  async read() {
    await this.router.read();

    const meshName = this.meshName;
    const virtualRouterName = this.router.virtualRouterName;
    const region = this.region;

    this._routes = await Route
      .list({ meshName, virtualRouterName, region })
      .then((routes) => Promise.all(
        routes.map((route) => route.read())
      ));

    const nodeNames = new Set();
    this._routes.forEach((route) => {
      route.spec.httpRoute.action.weightedTargets.forEach((target) => {
        nodeNames.add(target.virtualNode);
      });
    });

    this._nodes = await VirtualNode
      .list({ meshName, region })
      .then((nodes) => nodes.filter(
        (node) => nodeNames.has(node.virtualNodeName)
      ))
      .then((nodes) => Promise.all(
        nodes.map((node) => node.read())
      ));

    return this;
  }

  async update() {

  }

  async delete() {
    await this.read();
    await Promise.all(this.routes.map((route) => route.delete()));
    await Promise.all(this.nodes.map((node) => node.delete()));
    await this.router.delete();
  }

  static async list({ meshName, region = 'us-east-1' }) {
    const routers = await VirtualRouter.list({ meshName, region })
      .then((routers) => Promise.all(routers.map((router) => router.read())));

    return routers.map(
      (router) => new MeshService({
        meshName: router.meshName,
        logicalName: router.virtualRouterName,
        serviceNames: router.spec.serviceNames,
        region
      })
    );
  }
}

module.exports = MeshService;
