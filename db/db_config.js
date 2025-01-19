const { Pool } = require('pg');

// Validate environment variables to catch configuration issues early
if (!process.env.HOST || !process.env.USER || !process.env.DATABASE || !process.env.PASSWORD) {
  throw new Error(
    "Missing database configuration in environment variables. Please check HOST, USER, PASSWORD, and DATABASE."
  );
}

// Function to create a connection pool for PostgreSQL
const createPool = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum number of connections in the pool
  });

  // Test the connection
  pool
    .connect()
    .then((client) => {
      console.log("Successfully connected to the PostgreSQL database.");
      client.release(); // Release the client back to the pool
    })
    .catch((err) => {
      console.error("Failed to connect to the PostgreSQL database:");
      console.error(err.message);
      process.exit(1); // Exit the process if initial connection fails
    });

  // Handle errors on the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on PostgreSQL client:', err.message);
    process.exit(1); // Exit the process on unexpected errors
  });

  return pool;
};

// Create connection pool
const pool = createPool();

// Export pool object for querying
module.exports = pool;
