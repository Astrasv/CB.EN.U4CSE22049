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
  return priceHistory.filter(data => new Date(data.lastUpdatedAt) >= cutoffTime);
}

function calculateAveragePrice(priceHistory) {
  if (!priceHistory.length) return 0;
  return priceHistory.reduce((sum, data) => sum + data.price, 0) / priceHistory.length;
}

function calculateCorrelation(hist1, hist2) {
  const aligned = alignPriceHistories(hist1, hist2);
  const prices1 = aligned.map(a => a.price1);
  const prices2 = aligned.map(a => a.price2);

  console.log('Correlation inputs:', { prices1, prices2 });

  if (prices1.length < 2) {
    console.log('Not enough aligned data points for correlation');
    return 0;
  }

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

  const correlation = std1 * std2 === 0 ? 0 : cov / (std1 * std2);
  console.log('Correlation result:', correlation);

  return correlation;
}

function alignPriceHistories(hist1, hist2) {
  const aligned = [];
  const maxTimeDiff = 10 * 60 * 1000; 

  console.log('Aligning histories:', { hist1, hist2 });

  for (const entry1 of hist1) {
    const time1 = new Date(entry1.lastUpdatedAt).getTime();
    let closest = null;
    let minTimeDiff = Infinity;

    for (const entry2 of hist2) {
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

  console.log('Aligned pairs:', aligned);
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

  const hist1 = filterByTimeRange(await getStockPriceHistory(ticker1, minutes), minutes);
  const hist2 = filterByTimeRange(await getStockPriceHistory(ticker2, minutes), minutes);

  res.json({
    correlation: calculateCorrelation(hist1, hist2),
    stocks: {
      [ticker1]: {
        averagePrice: calculateAveragePrice(hist1),
        priceHistory: hist1
      },
      [ticker2]: {
        averagePrice: calculateAveragePrice(hist2),
        priceHistory: hist2
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});