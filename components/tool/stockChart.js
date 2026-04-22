import { z } from "zod";
import { tool } from "ai";
import { StockChartToolPrompt } from "@/app/Prompt/StockChartToolPrompt";
import { fetchStockChartData } from "@/app/lib/fetchData";

export const getStockChart = tool({
  description: StockChartToolPrompt,
  parameters: z.object({
    symbol: z
      .string()
      .min(1, "SYMBOL IS MANDATORY - NEVER LEAVE UNDEFINED")
      .describe("REQUIRED: Ticker symbol (e.g. AAPL, RELIANCE.NS). MUST NOT BE UNDEFINED."),
    range: z
      .string()
      .optional()
      .describe("Time range e.g. 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max"),
    interval: z
      .string()
      .optional()
      .describe("Data interval e.g. 1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo"),
  }),
  execute: async ({ symbol, range = "1mo", interval = "1d" }) => {
    console.log("🛠 Call Tool: getStockChart", { symbol, range, interval });
    if (!symbol) {
      return { error: "Symbol is required. You MUST provide a 'symbol' argument." };
    }

    try {
      const chartData = await fetchStockChartData(symbol.trim().toUpperCase(), range, interval);
      
      // Simplify data for the LLM to process and return in markdown
      const simplifiedData = chartData.quotes
        .filter(q => q.close !== undefined)
        .map(q => ({
          date: q.date.toISOString().split('T')[0],
          price: Number(q.close.toFixed(2))
        }));

      return {
        symbol: symbol.toUpperCase(),
        range,
        data: simplifiedData
      };
    } catch (err) {
      return { error: err?.message, symbol };
    }
  },
});
