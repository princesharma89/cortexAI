import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js"
import { checkLimits } from "../utils/checkLimits.js"

export const chatAgent = async (state) => {
  try{
     await checkLimits(state.userId, "chat");
  const llm = await getModel("chat");
  const storedHistory = await getMemory(state.conversationId);
  const history = Array.isArray(storedHistory) ? storedHistory : [];
  const maxHistoryCharacters = 10000;
  let historyCharacters = 0;
  const recentHistory = [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    const content = String(message.content || "");
    if (historyCharacters + content.length > maxHistoryCharacters) {
      break;
    }
    recentHistory.unshift({ ...message, content });
    historyCharacters += content.length;
  }

  const prompt = String(state.prompt || "").slice(0, 6000);
  const searchContext = state.searchResults
    ? `
Web Search Results:

${JSON.stringify(state.searchResults).slice(0, 6000)}

Answer the user using only the above search results.
`
    : "";
  const systemPrompt = `
You are CortexAI, an intelligent AI assistant.

${searchContext}

If searchContext exists:

- Use search results to answer.
- Do not mention internal tools.

Rules:

- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean Markdown.



Formatting:
- Use # for titles and ## for sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never write headings and content on the same line.
- Never generate large walls of text.
`;
  const messages = [new SystemMessage(systemPrompt)];

  recentHistory.forEach((msg) => {
    if (msg.role == "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role == "assistant") {
      messages.push(new AIMessage(msg.content));
    }
  });
  messages.push(new HumanMessage(prompt));
  const response = await llm.invoke(messages);
  messages.push(new AIMessage(response.content));
  await deductCredits(state.userId, "chat");
  return {
    ...state,
    aiResponse: response.content,
  };
  }
  catch(error){
    console.error("Error in chatAgent:", error);
    return {
      ...state,
      aiResponse: error?.data?.message || "❌ Failed to generate response.",
    };
  }
};
