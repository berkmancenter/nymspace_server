const { ChatOpenAI } = require('@langchain/openai')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')
// eslint-disable-next-line import/no-unresolved
const { isWithinTokenLimit } = require('gpt-tokenizer/model/gpt-3.5-turbo')
const config = require('../../../../config/config')

class ChatAI {
  constructor() {
    this.llm = new ChatOpenAI(
      {
        apiKey: config.llms.openAI.key
        // can specify model here, default is gpt-3.5.-turbo
      },
      {
        basePath: config.llms.basePath
      }
    )
  }

  async getResponse(template, convHistory, topic) {
    const prompt = PromptTemplate.fromTemplate(template)
    const answerChain = prompt.pipe(this.llm).pipe(new StringOutputParser())
    return answerChain.invoke({
      convHistory,
      topic
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async isInTokenLimit(promptText, tokenLimit) {
    return isWithinTokenLimit(promptText, tokenLimit)
  }
}

module.exports = ChatAI
