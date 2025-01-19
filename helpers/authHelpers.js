const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../db/db_config");

// Check if user with email or username already exists
const checkUserExistence = (username = null, email, callback) => {
    let query;
    let params;
  
   
    if (username) {
      query = "SELECT * FROM users WHERE username = $1 OR email = $2;";
      params = [username, email];
    } else {
    
      query = "SELECT * FROM users WHERE email = $1;";
      params = [email];
    }
  
    // Execute the query with the dynamic parameters
    connection.query(query, params, callback);
  };
// Hash the password before storing it in the database
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) reject(err);
            resolve(hashedPassword);
        });
    });
};

// Compare passwords
const comparePassword = (enteredPassword, storedPassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(enteredPassword, storedPassword, (err, isMatch) => {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { checkUserExistence, hashPassword, comparePassword, generateToken };
