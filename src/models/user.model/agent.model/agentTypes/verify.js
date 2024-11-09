const PROPERTIES = [
  'name',
  'description',
  'maxTokens',
  'minNewMessages',
  'useNumLastMessages',
  'timerPeriod',
  'initialize',
  'evaluate',
  'isWithinTokenLimit'
]

module.exports = function (agentType) {
  for (const prop of PROPERTIES) {
    // properties should exist even if they are undefined, to show all properties have been considered for a new agentType
    if (!Object.hasOwn(agentType, prop)) throw new Error(`Agent type missing required property ${prop}`)
  }

  return agentType
}
