const dotenv = require('dotenv')
const path = require('path')
const Joi = require('joi')

const env = process.env.NODE_ENV === 'development' ? '.env.local' : '.env'
dotenv.config({ path: path.join(__dirname, `../../${env}`) })

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    WEBSOCKET_BASE_PORT: Joi.number().default(5555),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    MONGODB_DEBUG: Joi.boolean().description('Enable mongoose debugging'),
    NYMSPACE_ENABLE_AGENTS: Joi.boolean().default(false).description('Enable agent support'),
    NYMSPACE_ENABLE_POLLS: Joi.boolean().default(false).description('Enable poll support'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(120)
      .description('minutes after which a password reset token expires'),
    AUTH_TOKEN_SECRET: Joi.string().description('secret used to encrypt generated passwords'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    APP_HOST: Joi.string().description('the host url for the frontend app'),
    TRULY_RANDOM_PSEUDONYMS: Joi.string()
      .default('false')
      .description('true/false if pseudonyms are made truly random with UID'),
    MAX_MESSAGE_LENGTH: Joi.number().min(50).max(100000).default(2000).description('The maximum length of a message'),
    DAYS_FOR_GOOD_REPUTATION: Joi.number().default(1).description('the number of days it takes to get a good reputation'),
    OPENAI_API_KEY: Joi.string().default('INVALID_API_KEY').description('OpenAI key'),
    LANGCHAIN_API_BASE_PATH: Joi.string().description('LangChain API base path'),
    PERSPECTIVE_API_KEY: Joi.string().description('Perspective API key')
  })
  .unknown()

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  websocketBasePort: envVars.WEBSOCKET_BASE_PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    debug: envVars.MONGODB_DEBUG,
    options: {
      // useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    from: envVars.EMAIL_FROM
  },
  auth: {
    authTokenSecret: envVars.AUTH_TOKEN_SECRET
  },
  maxMessageLength: envVars.MAX_MESSAGE_LENGTH,
  enablePolls: envVars.NYMSPACE_ENABLE_POLLS,
  enableAgents: envVars.NYMSPACE_ENABLE_AGENTS,
  llms: {
    basePath: envVars.LANGCHAIN_API_BASE_PATH,
    openAI: {
      key: envVars.OPENAI_API_KEY
    },
    perspectiveAPI: {
      key: envVars.PERSPECTIVE_API_KEY
    }
  },
  appHost: envVars.APP_HOST,
  trulyRandomPseudonyms: envVars.TRULY_RANDOM_PSEUDONYMS,
  DAYS_FOR_GOOD_REPUTATION: envVars.DAYS_FOR_GOOD_REPUTATION
}
