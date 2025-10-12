const express = require('express')
const helmet = require('helmet')
const xss = require('xss-clean')
const mongoSanitize = require('express-mongo-sanitize')
const compression = require('compression')
const cors = require('cors')
const passport = require('passport')
const httpStatus = require('http-status')
require('./websockets')
const cookieParser = require('cookie-parser')
const config = require('./config/config')
const morgan = require('./config/morgan')
const { jwtStrategy } = require('./config/passport')
const { authLimiter } = require('./middlewares/rateLimiter')
const routes = require('./routes/v1')
const { errorConverter, errorHandler } = require('./middlewares/error')
const ApiError = require('./utils/ApiError')

const app = express()

if (config.env !== 'test') {
  app.use(morgan.successHandler)
  app.use(morgan.errorHandler)
}

// set proxy
app.set('trust proxy', config.trustProxy /* number of proxies between user and server */)

// set security HTTP headers
app.use(helmet())

// parse json request body
app.use(express.json())

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }))

// sanitize request data
app.use(xss())
app.use(mongoSanitize())

// gzip compression
app.use(compression())

app.use(cookieParser())

// enable cors
const corsOptions = {
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// jwt authentication
app.use(passport.initialize())
passport.use('jwt', jwtStrategy)

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter)
}

// v1 api routes
app.use('/v1', routes)

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

// convert error to ApiError, if needed
app.use(errorConverter)

// handle error
app.use(errorHandler)

// additional headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')

  next()
})

module.exports = app
