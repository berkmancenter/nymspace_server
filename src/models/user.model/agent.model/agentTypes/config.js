module.exports = new Promise((resolve) => {
  import('./index.mjs').then((exports) => {
    const agentTypes = exports.default
    resolve(
      Object.keys(agentTypes).map((agentType) => {
        return {
          agentType,
          name: agentTypes[agentType].name,
          description: agentTypes[agentType].description
        }
      })
    )
  })
})
