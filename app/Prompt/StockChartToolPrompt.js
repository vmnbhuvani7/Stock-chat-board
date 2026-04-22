export const StockChartToolPrompt = `Fetch historical stock chart data.
IMPORTANT: You MUST always call this tool with a valid symbol argument.
NEVER call with empty arguments {}.
Always use format: {"symbol": "TICKER", "range": "1mo", "interval": "1d"}

Symbol rules:
- BSE Indian stocks → append .BO (e.g. INFY.BO, RELIANCE.BO, TCS.BO)
- NSE Indian stocks → append .NS (e.g. INFY.NS, RELIANCE.NS)  
- US stocks → plain symbol (e.g. AAPL, TSLA, GOOGL)

Valid ranges: "1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"
Valid intervals: "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"

Examples of correct calls:
- "INFY chart for last month" → {"symbol": "INFY.BO", "range": "1mo", "interval": "1d"}
- "Apple stock chart 1 year" → {"symbol": "AAPL", "range": "1y", "interval": "1d"}`
