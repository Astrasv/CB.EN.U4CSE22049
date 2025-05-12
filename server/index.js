require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const BEARER_TOKEN = process.env.BEARER_TOKEN;
if (!BEARER_TOKEN) throw new Error('BEARER_TOKEN not set');

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



// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});