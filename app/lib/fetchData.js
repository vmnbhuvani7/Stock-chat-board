import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

function calculateMOSPercent(price, eps, bookValue) {
  if (!price || !eps || !bookValue) return null;

  const intrinsic = Math.sqrt(22.5 * eps * bookValue);
  return Number((((intrinsic - price) / intrinsic) * 100).toFixed(2));
}

function calculateFourMScore(data) {
  let score = 0;

  if (data.peRatio && data.peRatio < 15) score += 25;
  else if (data.peRatio && data.peRatio < 25) score += 18;
  else score += 10;

  if (data.marketCap > 10e9) score += 25;
  else if (data.marketCap > 2e9) score += 18;
  else score += 10;

  if (data.eps > 3) score += 25;
  else if (data.eps > 1) score += 18;
  else score += 10;

  if (data.changePercent > 5) score += 25;
  else if (data.changePercent > 0) score += 18;
  else score += 10;

  return Math.min(score, 100);
}

export async function fetchStockData(symbol) {
  const quote = await yahooFinance.quote(symbol);

  const time =
    quote.regularMarketTime > 1e12
      ? quote.regularMarketTime
      : quote.regularMarketTime * 1000;
  const eps = quote.epsTrailingTwelveMonths;
  const bookValue = quote.bookValue;
  const price = quote.regularMarketPrice;

  const mosPercent = calculateMOSPercent(price, eps, bookValue);

  const result = {
    stock: quote.longName || quote.shortName || symbol,
    symbol,
    price: quote.regularMarketPrice,
    previousClose: quote.regularMarketPreviousClose,
    changePercent: quote.regularMarketChangePercent,
    weekHigh52: quote.fiftyTwoWeekHigh,
    weekLow52: quote.fiftyTwoWeekLow,
    weekHigh52ChangePercent: quote.fiftyTwoWeekHighChangePercent,
    weekLow52ChangePercent: quote.fiftyTwoWeekLowChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    peRatio: quote.trailingPE,
    currency: quote.currency,
    exchange: quote.fullExchangeName,
    marketTime: new Date(time).toLocaleString(),
  };
  const fourMScore = calculateFourMScore(result);

  return {
    ...result,
    marginOfSafety: mosPercent ? `${mosPercent}%` : null,
    fourMScore: `${fourMScore}/100`,
  };
}

export async function fetchStockChartData(symbol, range = '1mo', interval = '1d') {
  try {
    const now = new Date();
    let period1;

    switch (range) {
      case '1d': period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '5d': period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); break;
      case '1mo': period1 = new Date(new Date().setMonth(now.getMonth() - 1)); break;
      case '3mo': period1 = new Date(new Date().setMonth(now.getMonth() - 3)); break;
      case '6mo': period1 = new Date(new Date().setMonth(now.getMonth() - 6)); break;
      case '1y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 1)); break;
      case '2y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 2)); break;
      case '5y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 5)); break;
      case '10y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 10)); break;
      case 'ytd': period1 = new Date(now.getFullYear(), 0, 1); break;
      case 'max': period1 = new Date(0); break;
      default: period1 = new Date(new Date().setMonth(now.getMonth() - 1));
    }

    const queryOptions = { 
      period1, 
      period2: now, 
      interval 
    };
    const chart = await yahooFinance.chart(symbol, queryOptions);
    return chart;
  } catch (err) {
    throw err;
  }
}