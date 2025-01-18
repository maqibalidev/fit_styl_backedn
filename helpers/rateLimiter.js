// helpers/rateLimiter.js
const rateLimitStore = new Map(); // To store request counts and timestamps

const rateLimiter = (uniqueKey, rateLimitConfig) => (req, res, next) => {
  const userId = req.user.userId; // Assuming `req.user` contains userId
  const currentTime = Date.now();

  const key = `${userId}_${uniqueKey}`; // Combine userId with the uniqueKey

  // Check if the rate limit configuration exists for the given uniqueKey
  if (!rateLimitConfig) {
    return res.status(500).json({ message: `Rate limit configuration for ${uniqueKey} not found.` });
  }

  const { limit, window } = rateLimitConfig;

  // If the user+API key doesn't exist in the store, initialize their data
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, startTime: currentTime });
    return next();
  }

  const userData = rateLimitStore.get(key);
  const elapsedTime = currentTime - userData.startTime;

  if (elapsedTime > window) {
    // Reset the request count if the time window has expired
    rateLimitStore.set(key, { count: 1, startTime: currentTime });
    return next();
  }

  if (userData.count >= limit) {
    // Block the request if the limit is exceeded
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }

  // Increment the request count
  userData.count += 1;
  rateLimitStore.set(key, userData);

  next();
};

module.exports = { rateLimiter };
