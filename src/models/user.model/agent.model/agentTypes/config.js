module.exports = new Promise((resolve) => {
  import('./index.mjs').then((agentTypes) => {
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
