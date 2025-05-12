import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

function Heatmap({ tickers, correlationData, stockDetails, minutes }) {
  const getColor = (value) => {
    if (value >= 0.7) return '#006400';
    if (value >= 0.3) return '#90EE90';
    if (value > -0.3) return '#F5F5F5';
    if (value > -0.7) return '#FF4040';
    return '#8B0000';
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Correlation Heatmap (Last {minutes} Minutes)
      </Typography>
      <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
        {/* xaxis labesl*/}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ width: 60 }} /> 
          {tickers.map((ticker) => (
            <Typography key={ticker} sx={{ width: 60, textAlign: 'center', fontWeight: 'bold' }}>
              {ticker}
            </Typography>
          ))}
        </Box>
        {/* main grid*/}
        {tickers.map((tickerY, yIndex) => (
          <Box key={tickerY} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/*yaxis labels*/}
            <Typography sx={{ width: 60, fontWeight: 'bold' }}>{tickerY}</Typography>
            {/* maincells */}
            {tickers.map((tickerX, xIndex) => {
              const correlation = correlationData[`${tickerY}-${tickerX}`] || 0;
              return (
                <Tooltip
                  key={`${tickerY}-${tickerX}`}
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2">{`${tickerY} vs ${tickerX}`}</Typography>
                      <Typography variant="body2">Correlation: {correlation.toFixed(2)}</Typography>
                      <Typography variant="body2">{`${tickerX} Avg: $${stockDetails[tickerX].averagePrice.toFixed(2)}`}</Typography>
                      <Typography variant="body2">{`${tickerX} Std Dev: $${stockDetails[tickerX].stdDev.toFixed(2)}`}</Typography>
                      <Typography variant="body2">{`${tickerY} Avg: $${stockDetails[tickerY].averagePrice.toFixed(2)}`}</Typography>
                      <Typography variant="body2">{`${tickerY} Std Dev: $${stockDetails[tickerY].stdDev.toFixed(2)}`}</Typography>
                    </Box>
                  }
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: getColor(correlation),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: Math.abs(correlation) > 0.5 ? '#fff' : '#000' }}>
                      {correlation.toFixed(2)}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption">Color Legend:</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#006400', mr: 1 }} />
            <Typography variant="caption">Strong Positive (≥0.7)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#90EE90', mr: 1 }} />
            <Typography variant="caption">Moderate Positive (0.3–0.7)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#F5F5F5', mr: 1 }} />
            <Typography variant="caption">Neutral (-0.3–0.3)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#FF4040', mr: 1 }} />
            <Typography variant="caption">Moderate Negative (-0.7–-0.3)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#8B0000', mr: 1 }} />
            <Typography variant="caption">Strong Negative (≤-0.7)</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Heatmap;