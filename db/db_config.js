const mysql = require("mysql");

// Validate environment variables to catch configuration issues early
if (!process.env.HOST || !process.env.USER || !process.env.DATABASE) {
  throw new Error(
    "Missing database configuration in environment variables. Please check HOST, USER, and DATABASE."
  );
}

// CREATING CONNECTION

const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD || "",
  database: process.env.DATABASE,
  
});

// HANDLING ERRORS ON CONNECTION TO DATABASE

connection.connect((err) => {
  if (err) {
    console.error("Failed to connect to the database:");
    console.error(err.message);
    process.exit(1);
  } else {
    console.log("Successfully connected to the database.");
  }
});

module.exports = connection;
