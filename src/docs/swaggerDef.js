const { version } = require('../../package.json')
const config = require('../config/config')

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: "Berkman Klein Center's Nymspace API documentation",
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/berkmancenter/nymspace_server/blob/main/LICENSE'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`
    }
  ]
}

module.exports = swaggerDef
