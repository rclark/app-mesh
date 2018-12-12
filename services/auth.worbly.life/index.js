'use strict';

const Koa = require('koa');
const app = new Koa();

app.use(async (ctx) => {
  const token = ctx.query.access_token;
  ctx.assert(token === 'secret', 401, 'invalid access token');
  ctx.status = 200;
});

app.listen(8080);
