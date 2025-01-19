const mysql = require('mysql');

// Validate environment variables to catch configuration issues early
if (!process.env.HOST || !process.env.USER || !process.env.DATABASE) {
  throw new Error(
    "Missing database configuration in environment variables. Please check HOST, USER, and DATABASE."
  );
}

// Function to handle MySQL connection
const createConnection = () => {
  const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD || "",
    database: process.env.DATABASE,
  });

  // Connect to the database
  connection.connect((err) => {
    if (err) {
      console.error("Failed to connect to the database:");
      console.error(err.message);
      process.exit(1); // Exit the process if initial connection fails
    } else {
      console.log("Successfully connected to the database.");
    }
  });

  // Handle MySQL errors such as connection loss or disconnections
  connection.on('error', (err) => {
    console.error('Database error occurred:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      // The connection was lost (e.g., server restart)
      console.log("Reconnecting to the database...");
      createConnection(); // Reconnect to the database
    } else {
      // Other errors, log and exit the process
      console.error("Critical database error. Shutting down...");
      process.exit(1);
    }
  });

  return connection;
};

// Create initial connection
let connection = createConnection();

// Export connection object
module.exports = connection;
