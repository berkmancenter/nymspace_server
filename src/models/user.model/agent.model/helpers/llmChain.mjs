import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

async function getSinglePromptResponse(llm, template, inputParams) {
  const prompt = PromptTemplate.fromTemplate(template)
  const answerChain = prompt.pipe(llm).pipe(new StringOutputParser())
  return answerChain.invoke(inputParams)
}

export default { getSinglePromptResponse }
