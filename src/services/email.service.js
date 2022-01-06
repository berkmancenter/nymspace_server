const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send password reset email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.appHost}/reset-password?token=${token}`;
  console.log('Password Reset Link: ', resetPasswordUrl);
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, please ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.appHost}/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send email to user for channel archiving
 * @param {string} to
 * @param {Topic} topic
 * @param {string} token
 * @returns {Promise}
 */
const sendArchiveTopicEmail = async (to, topic, token) => {
  const subject = 'Archiving Your Threads Channel';
  // replace this url with the link to the archive topic page of your front-end app
  const archivalUrl = `${config.appHost}/archive-topic?topicId=${topic._id}&token=${token}`;
  const text = `Dear user,
Your channel "${topic.name}" is now 90 days old, and will be archived and removed from Threads in 7 days.
To prevent archival and keep your channel on Threads, please click on this link: ${archivalUrl}`;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendArchiveTopicEmail,
};
