const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

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
  isDeleted: {
    type: Boolean,
    default: false,
  }
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
      trim: true,
      validate: [validateEmail, 'Please fill a valid email address'],
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
