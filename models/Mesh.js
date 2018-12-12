'use strict';

const client = require('../lib/client');

class Mesh {
  constructor({ meshName, region = 'us-east-1' } = {}) {
    this.meshName = meshName;
    this.region = region;
    this._description = {};
  }

  get client() { return client.get(this.region); }
  get metadata() { return this._description.metadata; }
  get status() { return this._description.status; }
  get arn() { return this._description.metadata.arn; }

  async exists() {
    return await Mesh
      .list({ region: this.region })
      .then((meshes) => meshes.find(
        (mesh) => mesh.meshName === this.meshName
      ))
      .then((mesh) => !!mesh);
  }

  async create() {
    if (await this.exists()) await this.read();

    else this._description = await this
      .client
      .createMesh({ meshName: this.meshName })
      .promise()
      .then((data) => data.mesh);

    return this;
  }

  async read() {
    this._description = await this.client
      .describeMesh({ meshName: this.meshName })
      .promise()
      .then((data) => data.mesh);

    return this;
  }
  async delete() {
    await this.client
      .deleteMesh({ meshName: this.meshName })
      .promise();
  }

  static async list({ region } = {}) {
    return new Promise((resolve, reject) => {
      const meshes = [];

      client.get(region)
        .listMeshes()
        .eachPage((err, data, done) => {
          if (err) return reject(err);
          if (!data) return resolve(meshes);

          data.meshes.forEach((m) => {
            const mesh = new Mesh({ meshName: m.meshName });
            mesh._description.metadata = { arn: m.arn };
            meshes.push(mesh);
          });

          done();
        });
    });
  }
}

module.exports = Mesh;
