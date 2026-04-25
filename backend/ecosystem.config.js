module.exports = {
  apps: [
    {
      name: "stayRate",
      script: "./dist/server.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        HTTPS_PORT: 443,
      },
    },
  ],
};