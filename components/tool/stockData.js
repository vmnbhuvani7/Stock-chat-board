import { z } from "zod";
import { tool } from "ai";
import { StockDataToolPrompt } from "@/app/Prompt/StockDataToolPrompt";
import { fetchStockData } from "@/app/lib/fetchData";

export const getStockData = tool({
  description: StockDataToolPrompt,
  parameters: z.object({
    symbol: z
      .string()
      .min(1, "SYMBOL IS MANDATORY - NEVER LEAVE UNDEFINED")
      .describe("REQUIRED: Ticker symbol (e.g. AAPL, RELIANCE.NS). MUST NOT BE UNDEFINED."),
  }),
  execute: async ({ symbol }) => {
    console.log("🛠 Call Tool: getStockData", { symbol });
    if (!symbol) {
      return { error: "Symbol is required. You MUST provide a 'symbol' argument." };
    }

    try {
      const stockData = await fetchStockData(symbol.trim().toUpperCase());
      return stockData;
    } catch (err) {
      return { error: err?.message, symbol };
    }
  },
});