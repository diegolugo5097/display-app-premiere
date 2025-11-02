// display-app/src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/media',
    createProxyMiddleware({
      target: 'https://control-app-premiere.netlify.app',
      changeOrigin: true,
      pathRewrite: { '^/media': '' }, // /media/ALIEN.mp4 -> /ALIEN.mp4
    })
  );
};
