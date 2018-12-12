'use strict';

const Mesh = require('./models/Mesh');
const MeshService = require('./models/MeshService');

const main = async () => {
  const meshName = 'starter';
  const mesh = new Mesh({ meshName });
  await mesh.create();

  const meshService = new MeshService({
    meshName,
    logicalName: 'authorization',
    serviceNames: ['auth.worbly.life']
  });

  const authNode = meshService.putNode({
    logicalName: 'authorization',
    backends: ['data.worbly.life', 'users.worbly.life'],
    dnsName: 'auth.worbly.life',
    portMappings: [{ protocol: 'http', port: 8080 }]
  });

  meshService.putRoute({
    logicalName: 'all',
    pathPrefix: '/',
    targets: [{ node: authNode, weight: 100 }]
  });

  await meshService.create();

  console.log(meshService);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
