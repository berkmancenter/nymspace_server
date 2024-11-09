module.exports = (messages, useNumLastMessages = 10, userMessage) => {
  const formattedMessages = messages
    .slice(messages.length - Math.min(messages.length, useNumLastMessages))
    .map((message) => {
      if (message.fromAgent) {
        return `AI: ${message.body}`
      }
      return `${message.pseudonym}: ${message.body}`
    })

  if (userMessage) formattedMessages.push(`${userMessage.user}: ${userMessage.body}`)

  return formattedMessages
}
