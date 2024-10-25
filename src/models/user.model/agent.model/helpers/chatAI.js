const { ChatOpenAI } = require('@langchain/openai')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { isWithinTokenLimit } = require('gpt-tokenizer')
const config = require('../../../../config/config')

const llm = new ChatOpenAI(
  {
    apiKey: config.llms.openAI.key
    // can specify model here, default is gpt-3.5.-turbo
  },
  {
    basePath: config.llms.basePath
  }
)

const getResponse = async (template, convHistory, topic) => {
  const prompt = PromptTemplate.fromTemplate(template)
  const answerChain = prompt.pipe(llm).pipe(new StringOutputParser())
  return answerChain.invoke({
    convHistory,
    topic
  })
}

const isInTokenLimit = async (promptText, tokenLimit) => {
  return isWithinTokenLimit(promptText, tokenLimit)
}

module.exports = {
  isInTokenLimit,
  getResponse
}
