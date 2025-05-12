import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import StockChart from './StockChart';

function StockPage() {
  const [ticker, setTicker] = useState('NVDA');
  const [minutes, setMinutes] = useState(60);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8080/stocks/${ticker}?minutes=${minutes}&aggregation=average`);
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch stock data');
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [ticker, minutes]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Stock Price Analysis
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Ticker</InputLabel>
          <Select value={ticker} onChange={(e) => setTicker(e.target.value)}>
            <MenuItem value="AMD">AMD</MenuItem>
            <MenuItem value="GOOGL">GOOGL</MenuItem>
            <MenuItem value="GOOG">GOOG</MenuItem>
            <MenuItem value="AMZN">AMZN</MenuItem>
            <MenuItem value="AMGN">AMGN</MenuItem>
            <MenuItem value="AAPL">AAPL</MenuItem>
            <MenuItem value="BRKB">BRKB</MenuItem>
            <MenuItem value="BKNG">BKNG</MenuItem>
            <MenuItem value="AVGO">AVGO</MenuItem>
            <MenuItem value="CSX">CSX</MenuItem>
            <MenuItem value="LLY">LLY</MenuItem>
            <MenuItem value="MAR">MAR</MenuItem>
            <MenuItem value="MRVL">MRVL</MenuItem>
            <MenuItem value="META">META</MenuItem>
            <MenuItem value="MSFT">MSFT</MenuItem>
            <MenuItem value="NVDA">NVDA</MenuItem>
            <MenuItem value="PYPL">PYPL</MenuItem>
            <MenuItem value="2330TW">2330TW</MenuItem>
            <MenuItem value="TSLA">TSLA</MenuItem>
            <MenuItem value="V">V</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time (minutes)</InputLabel>
          <Select value={minutes} onChange={(e) => setMinutes(e.target.value)}>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={60}>60</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {data && (
        <StockChart
          priceHistory={data.priceHistory}
          averagePrice={data.averageStockPrice}
          ticker={ticker}
          minutes={minutes}
        />
      )}
    </Box>
  );
}

export default StockPage;