'use strict';

const client = require('../lib/client');
const validate = require('../lib/validate');
const specs = require('../lib/specs');

class VirtualNode {
  constructor({
    meshName,
    virtualNodeName,
    region = 'us-east-1'
  } = {}) {
    this.meshName = meshName;
    this.virtualNodeName = virtualNodeName;
    this.region = region;
    this._description = {};
  }

  get client() { return client.get(this.region); }
  get metadata() { return this._description.metadata; }
  get status() { return this._description.status; }
  get arn () { return this._description.metadata.arn; }

  get spec() { return this._description.spec; }
  set spec({ backends, listeners, serviceDiscovery }) {
    validate(specs.virtualNode, { backends, listeners, serviceDiscovery });
    this._description.spec = { backends, listeners, serviceDiscovery };
  }

  async exists() {
    return await VirtualNode
      .list({ meshName: this.meshName, region: this.region })
      .then((virtualNodes) => virtualNodes.find(
        (virtualNode) => virtualNode.virtualNodeName === this.virtualNodeName
      ))
      .then((virtualNode) => !!virtualNode);
  }

  async create() {
    if (await this.exists()) await this.read();

    else this._description = await this.client
      .createVirtualNode({
        meshName: this.meshName,
        virtualNodeName: this.virtualNodeName,
        spec: this.spec
      })
      .promise()
      .then((data) => data.virtualNode);

    return this;
  }

  async read() {
    this._description = await this.client
      .describeVirtualNode({
        meshName: this.meshName,
        virtualNodeName: this.virtualNodeName
      })
      .promise()
      .then((data) => data.virtualNode);

    return this;
  }

  async update() {
    this._description = await this.client
      .updateVirtualNode({
        meshName: this.meshName,
        virtualNodeName: this.virtualNodeName,
        spec: this.spec
      })
      .promise()
      .then((data) => data.virtualNode);

    return this;
  }

  async delete() {
    this._description = await this.client
      .deleteVirtualNode({
        meshName: this.meshName,
        virtualNodeName: this.virtualNodeName
      })
      .promise();

    return this;
  }

  static async list({
    meshName,
    region
  } = {}) {
    return new Promise((resolve, reject) => {
      const virtualNodes = [];

      client.get(region)
        .listVirtualNodes({ meshName })
        .eachPage((err, data, done) => {
          if (err) return reject(err);
          if (!data) return resolve(virtualNodes);

          data.virtualNodes.forEach((v) => {
            const virtualNode = new VirtualNode({ meshName, virtualNodeName: v.virtualNodeName });
            virtualNode._description.metadata = { arn: v.arn };
            virtualNodes.push(virtualNode);
          });

          done();
        });
    });
  }
}

module.exports = VirtualNode;
