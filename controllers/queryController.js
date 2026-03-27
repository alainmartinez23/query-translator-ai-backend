const queryService = require('../services/queryService');

async function handleQuery(req, res) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const result = await queryService.translateAndExecute(prompt);
    return res.status(200).json(result);
  } catch (err) {
    console.error('handleQuery error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleQuery };
