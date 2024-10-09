/**
 * @enum {number}
 */
const AgentMessageActions = {
  OK: 0,
  REJECT: 1,
  ANNOTATE: 2
}

module.exports.AgentMessageActions = AgentMessageActions

/**
 * @typedef {Object} AgentResponse
 * @property {string} agent
 * @property {string} name
 * @property {AgentMessageAction} action
 * @property {string} suggestion // back to submitter
 * @property {string} annotation // text to add from agent to the thread
 */
