import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Typography } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function StockChart({ priceHistory, averagePrice, ticker, minutes }) {
  const labels = priceHistory.map((entry) =>
    new Date(entry.lastUpdatedAt).toLocaleTimeString()
  );
  const prices = priceHistory.map((entry) => entry.price);

  const chartData = {
    labels,
    datasets: [
      {
        label: `${ticker} Price`,
        data: prices,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Average Price',
        data: Array(prices.length).fill(averagePrice),
        borderColor: '#dc004e',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const price = context.parsed.y;
            const time = context.label;
            return context.dataset.label === 'Average Price'
              ? `Average Price: $${price.toFixed(2)}`
              : `Price: $${price.toFixed(2)} at ${time}`;
          },
        },
      },
      title: {
        display: true,
        text: `${ticker} Stock Price (Last ${minutes} Minutes)`,
      },
    },
    scales: {
      y: { title: { display: true, text: 'Price ($)' } },
      x: { title: { display: true, text: 'Time' } },
    },
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Price Trend
      </Typography>
      <Line data={chartData} options={options} />
    </Box>
  );
}

export default StockChart;