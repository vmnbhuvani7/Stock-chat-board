import { ToolLoopAgent } from 'ai';
import { createMistral } from "@ai-sdk/mistral";
import { SYSTEM_PROMPT } from "@/app/Prompt/SystemPrompt";
import { getStockData } from '../tool/stockData';
import { getStockChart } from '../tool/stockChart';
const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });

export const stockAgent = new ToolLoopAgent({
  model: mistral("mistral-large-latest"),
  instructions: SYSTEM_PROMPT,
  tools: { getStockData, getStockChart },
  maxSteps: 10,
});