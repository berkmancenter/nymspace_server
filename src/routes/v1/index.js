const express = require('express')
const authRoute = require('./auth.route')
const userRoute = require('./user.route')
const docsRoute = require('./docs.route')
const messagesRoute = require('./messages.route')
const topicsRoute = require('./topics.route')
const threadsRoute = require('./threads.route')
const configRoute = require('./config.route')
const config = require('../../config/config')
const pollsRoute = require('./polls.route')
const exportRoute = require('./export.route')

const router = express.Router()

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/messages',
    route: messagesRoute
  },
  {
    path: '/topics',
    route: topicsRoute
  },
  {
    path: '/threads',
    route: threadsRoute
  },
  {
    path: '/polls',
    route: pollsRoute
  },
  {
    path: '/config',
    route: configRoute
  },
  {
    path: '/export',
    route: exportRoute
  }
]

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute
  }
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route)
  })
}

module.exports = router
