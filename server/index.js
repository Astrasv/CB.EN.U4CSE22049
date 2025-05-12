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


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});