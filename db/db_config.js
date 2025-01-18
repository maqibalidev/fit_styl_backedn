const mysql = require("mysql");

// Validate environment variables to catch configuration issues early
if (!process.env.HOST || !process.env.USER || !process.env.DATABASE) {
  throw new Error(
    "Missing database configuration in environment variables. Please check HOST, USER, and DATABASE."
  );
}

// CREATING CONNECTION POOL

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD || "",
  database: process.env.DATABASE,
  connectionLimit: 10, // maximum number of connections to create in the pool
  waitForConnections: true, // when the pool is exhausted, it will queue the connections until one becomes available
  queueLimit: 0, // unlimited queue length (can be adjusted as needed)
});

// HANDLING ERRORS ON CONNECTION TO DATABASE
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Failed to connect to the database:");
    console.error(err.message);
    process.exit(1);
  } else {
    console.log("Successfully connected to the database.");
  }

  // Release the connection back to the pool
  if (connection) connection.release();
});



// GRACEFUL SHUTDOWN HANDLING (For when the app is terminated)
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  pool.end((err) => {
    if (err) {
      console.error("Error closing database pool:", err.message);
    } else {
      console.log("Database pool closed.");
    }
    process.exit();
  });
});

module.exports = pool;
