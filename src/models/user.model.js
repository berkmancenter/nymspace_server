const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const pseudonymSchema = new mongoose.Schema({ 
  token: { 
    type: String,
    required: true,
  },
  pseudonym: { 
    type: String,
    required: true,
  },
  active: { 
    type: Boolean,
  },
});

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    pseudonyms: {
      type: [pseudonymSchema],
      required: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    goodReputation: {
      type: Boolean
    },
    email: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.pre('validate', function (next) {
  const user = this;
  user.role = 'user';
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
