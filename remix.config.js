/** @type {import('@remix-run/dev').AppConfig} */
const commonConfig = {
    ignoredRouteFiles: ["**/.*"],
    future: {
        v2_routeConvention: true,
    },
};

module.exports =
    process.env.NODE_ENV === "production"
        ? {
              ...commonConfig,
              publicPath: "/_static/build/",
              server: "./server.js",
              serverBuildPath: "server/index.js",
          }
        : {
              ...commonConfig,
          };
