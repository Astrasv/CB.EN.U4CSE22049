import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, Chip } from '@mui/material';
import axios from 'axios';
import Heatmap from './Heatmap';

function CorrelationHeatmap() {
  const [minutes, setMinutes] = useState(60);
  const [selectedTickers, setSelectedTickers] = useState(['GOOG', 'NVDA', 'PYPL']); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableTickers = [
    'AMD',
    'GOOGL',
    'GOOG',
    'AMZN',
    'AMGN',
    'AAPL',
    'BRKB',
    'BKNG',
    'AVGO',
    'CSX',
    'LLY',
    'MAR',
    'MRVL',
    'META',
    'MSFT',
    'NVDA',
    'PYPL',
    '2330TW',
    'TSLA',
    'V'
  ];

  useEffect(() => {
    const fetchCorrelations = async () => {
      if (selectedTickers.length < 2) {
        setError('Please select at least two tickers');
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching correlation data for minutes=${minutes}, tickers=`, selectedTickers);
        const correlationData = {};
        const stockDetails = {};

        for (const ticker of selectedTickers) {
          console.log(`Fetching stock data for ${ticker}`);
          const response = await axios.get(
            `http://localhost:8080/stocks/${ticker}?minutes=${minutes}&aggregation=average`
          );
          console.log(`Stock API Response for ${ticker}:`, response.data);
          const prices = response.data.priceHistory.map((entry) => entry.price);
          stockDetails[ticker] = {
            averagePrice: response.data.averageStockPrice,
            stdDev: prices.length > 1
              ? Math.sqrt(
                  prices.reduce((sum, price) => sum + Math.pow(price - response.data.averageStockPrice, 2), 0) /
                    (prices.length - 1)
                )
              : 0,
            priceHistory: response.data.priceHistory,
          };
        }

        for (let i = 0; i < selectedTickers.length; i++) {
          for (let j = i; j < selectedTickers.length; j++) {
            const ticker1 = selectedTickers[i];
            const ticker2 = selectedTickers[j];
            if (ticker1 === ticker2) {
              correlationData[`${ticker1}-${ticker2}`] = 1;
            } else {
              console.log(`Fetching correlation for ${ticker1} and ${ticker2}`);
              const response = await axios.get(
                `http://localhost:8080/stockcorrelation?minutes=${minutes}&ticker=${ticker1}&ticker=${ticker2}`
              );
              console.log(`Correlation API Response for ${ticker1}-${ticker2}:`, response.data);
              correlationData[`${ticker1}-${ticker2}`] = response.data.correlation;
              correlationData[`${ticker2}-${ticker1}`] = response.data.correlation;
            }
          }
        }

        setData({ correlationData, stockDetails });
        console.log('Data set for Heatmap:', { correlationData, stockDetails, tickers: selectedTickers });
      } catch (err) {
        console.error('Correlation API Error:', err);
        setError(`Failed to fetch correlation data: ${err.message}${err.response ? ` (Status: ${err.response.status})` : ''}`);
      }
      setLoading(false);
    };
    fetchCorrelations();
  }, [minutes, selectedTickers]);

  const handleTickerChange = (event) => {
    setSelectedTickers(event.target.value);
    setData(null); 
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Correlation Heatmap
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Tickers</InputLabel>
          <Select
            multiple
            value={selectedTickers}
            onChange={handleTickerChange}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {availableTickers.map((ticker) => (
              <MenuItem key={ticker} value={ticker}>
                {ticker}
              </MenuItem>
            ))}
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
      {data && Array.isArray(selectedTickers) ? (
        <Heatmap
          tickers={selectedTickers}
          correlationData={data.correlationData}
          stockDetails={data.stockDetails}
          minutes={minutes}
        />
      ) : (
        !loading && !error && <Typography color="error">Please select at least two tickers</Typography>
      )}
    </Box>
  );
}

export default CorrelationHeatmap;