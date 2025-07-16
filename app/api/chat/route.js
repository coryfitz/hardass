import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import guiding_prompt from './prompt.js';

// Factory function to create LLM based on provider
function createLLM(provider) {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || 'gpt-4',
        temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 1000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    
    case 'anthropic':
      return new ChatAnthropic({
        modelName: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 1000,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// Create chat prompt template
const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', guiding_prompt],
  new MessagesPlaceholder('messages'),
]);

function convertMessagesToLangChain(messages) {
  return messages.map(msg => {
    switch (msg.role) {
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      case 'system':
        return new SystemMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}

export async function POST(request) {
  try {
    const { messages, provider } = await request.json();
    
    // Use provider from request or environment
    const selectedProvider = provider || process.env.LLM_PROVIDER || 'anthropic';
    
    // Create LLM instance
    const llm = createLLM(selectedProvider);
    
    // Create chain
    const chain = RunnableSequence.from([
      chatPrompt,
      llm,
    ]);
    
    // Convert messages to LangChain format
    const langChainMessages = convertMessagesToLangChain(messages);
    
    // Invoke the chain
    const response = await chain.invoke({
      messages: langChainMessages,
    });
    
    return Response.json({
      content: response.content,
      provider: selectedProvider,
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { message: 'Error processing request', error: error.message },
      { status: 500 }
    );
  }
}