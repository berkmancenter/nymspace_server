const mongoose = require('mongoose')
const { toJSON, paginate } = require('../plugins')
const { roles } = require('../../config/roles')
const BaseUser = require('./baseUser.model')
const pseudonymSchema = require('./schemas/pseudonym.schema')

const validateEmail = (email) => {
  const re =
    // eslint-disable-next-line
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return re.test(email)
}

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number')
        }
      },
      private: true // used by the toJSON plugin
    },
    pseudonyms: {
      type: [pseudonymSchema],
      required: true
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
      index: true
    },
    goodReputation: {
      type: Boolean,
      index: true
    },
    email: {
      type: String,
      trim: true,
      validate: [validateEmail, 'Please fill a valid email address']
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
userSchema.plugin(toJSON)
userSchema.plugin(paginate)

userSchema.virtual('activePseudonym').get(function () {
  return this.pseudonyms.find((x) => x.active)
})

userSchema.pre('validate', function (next) {
  const user = this
  user.role = 'user'
  next()
})

/**
 * @typedef User
 */
const User = BaseUser.discriminator('User', userSchema)

module.exports = User
