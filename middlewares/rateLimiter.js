const rateLimit = require('express-rate-limit');

const queryRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded — IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests' });
  },
});

module.exports = { queryRateLimiter };
