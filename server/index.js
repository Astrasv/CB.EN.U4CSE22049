require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const BEARER_TOKEN = process.env.BEARER_TOKEN;

async function getStockPriceHistory(ticker, minutes) {
  try {
    const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker}`, {
      params: { minutes },
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });
    if (Array.isArray(response.data)) return response.data;
    if (response.data.stock) return [{ price: response.data.stock.price, lastUpdatedAt: response.data.stock.lastUpdatedAt }];
    return [];
  } catch (error) {
    console.error(`Error fetching ${ticker}: ${error.message}`);
    return [];
  }
}


function filterByTimeRange(priceHistory, minutes) {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  return priceHistory.filter(entry => new Date(entry.lastUpdatedAt) >= cutoffTime);
}

function calculateAveragePrice(priceHistory) {
  if (!priceHistory.length) return 0;
  return priceHistory.reduce((sum, entry) => sum + entry.price, 0) / priceHistory.length;
}

function calculateCorrelation(history1, history2) {
  const aligned = alignPriceHistories(history1, history2);
  const prices1 = aligned.map(a => a.price1);
  const prices2 = aligned.map(a => a.price2);

  if (prices1.length < 2) return 0;

  const n = prices1.length;
  const mean1 = prices1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = prices2.reduce((sum, val) => sum + val, 0) / n;

  let cov = 0, std1 = 0, std2 = 0;
  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - mean1;
    const diff2 = prices2[i] - mean2;
    cov += diff1 * diff2;
    std1 += diff1 * diff1;
    std2 += diff2 * diff2;
  }

  cov = cov / (n - 1);
  std1 = Math.sqrt(std1 / (n - 1));
  std2 = Math.sqrt(std2 / (n - 1));

  return std1 * std2 === 0 ? 0 : cov / (std1 * std2);
}

function alignPriceHistories(history1, history2) {
  const aligned = [];
  const maxTimeDiff = 2 * 60 * 1000; 

  for (const entry1 of history1) {
    const time1 = new Date(entry1.lastUpdatedAt).getTime();
    let closest = null;
    let minTimeDiff = Infinity;

    for (const entry2 of history2) {
      const time2 = new Date(entry2.lastUpdatedAt).getTime();
      const timeDiff = Math.abs(time1 - time2);
      if (timeDiff < minTimeDiff && timeDiff <= maxTimeDiff) {
        minTimeDiff = timeDiff;
        closest = entry2;
      }
    }

    if (closest) {
      aligned.push({ price1: entry1.price, price2: closest.price });
    }
  }

  return aligned;
}


app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const minutes = parseInt(req.query.minutes) || 60;
  const aggregation = req.query.aggregation;

  if (aggregation !== 'average') return res.status(400).json({ error: 'Invalid aggregation type' });
  if (minutes <= 0) return res.status(400).json({ error: 'Minutes must be positive' });

  const priceHistory = filterByTimeRange(await getStockPriceHistory(ticker, minutes), minutes);

  res.json({
    averageStockPrice: calculateAveragePrice(priceHistory),
    priceHistory
  });
});

app.get('/stockcorrelation', async (req, res) => {
  const minutes = parseInt(req.query.minutes) || 60;
  const tickers = req.query.ticker;

  if (!Array.isArray(tickers) || tickers.length !== 2) {
    return res.status(400).json({ error: 'Exactly two tickers required' });
  }
  if (minutes <= 0) return res.status(400).json({ error: 'Minutes must be positive' });

  const [ticker1, ticker2] = tickers;

  const history1 = filterByTimeRange(await getStockPriceHistory(ticker1, minutes), minutes);
  const history2 = filterByTimeRange(await getStockPriceHistory(ticker2, minutes), minutes);

  res.json({
    correlation: calculateCorrelation(history1, history2),
    stocks: {
      [ticker1]: {
        averagePrice: calculateAveragePrice(history1),
        priceHistory: history1
      },
      [ticker2]: {
        averagePrice: calculateAveragePrice(history2),
        priceHistory: history2
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});