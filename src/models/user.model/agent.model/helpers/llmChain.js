const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')

async function getSinglePromptResponse(llm, template, inputParams) {
  const prompt = PromptTemplate.fromTemplate(template)
  const answerChain = prompt.pipe(llm).pipe(new StringOutputParser())
  return answerChain.invoke(inputParams)
}

module.exports = { getSinglePromptResponse }
