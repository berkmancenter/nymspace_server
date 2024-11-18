// const mongoose = require('mongoose')

/**
 * @enum {number}
 */
const AgentMessageActions = {
  OK: 0,
  REJECT: 1,
  CONTRIBUTE: 2
}

module.exports.AgentMessageActions = AgentMessageActions

/**
 * @typedef {Object} AgentEvaluation
 * @property {Message} userMessage
 * @property {AgentMessageAction} action
 * @property {Boolean} agentContributionVisible
 * @property {Boolean} userContributionVisible
 * @property {string} suggestion // back to submitter
 * @property {string} contribution // text to add from agent to the thread
 */

/**
 * @typedef {Object} AgentResponse
 * @property {Boolean} visible
 * @property {string} message
 */
