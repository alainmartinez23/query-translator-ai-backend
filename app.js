require('dotenv').config();
const express = require('express');
const queryController = require('./controllers/queryController');
const { queryRateLimiter } = require('./middlewares/rateLimiter');

const app = express();
app.use(express.json());

app.set('trust proxy', 1);

app.post('/query', queryRateLimiter, queryController.handleQuery);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
