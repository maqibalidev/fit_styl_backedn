const admin = require('firebase-admin'); // Firebase Admin SDK (ensure it's initialized)
const { checkUserExistence, generateToken } = require('../helpers/authHelpers');
const connection = require('../db/db_config');
const { v4: uuidv4 } = require('uuid');

const registerUserWithGoogle = async (req, res) => {
    const { token, name } = req.body;
    const userId = uuidv4();
    try {
      // Step 1: Verify Firebase ID Token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { email, displayName } = decodedToken; // Extract email and displayName from token

      if (!email) {
        return res.status(400).json({ message: "Invalid Firebase token: Email not found." });
      }
  
      // Use the provided name if available, fallback to Firebase display name
      const userName = name || displayName;
  
      // Step 2: Check if user already exists
      checkUserExistence(null, email, (err, data) => {
        if (err) {
          return res.status(500).json({ message: "Internal server error", error: err });
        }
  
        if (data?.rows?.length > 0) {
          const user = data.rows[0];
          const token = generateToken(user.id);
  
          return res.status(200).json({
            message: "Login successful",
            token: token,
            user: { id: user.id, username: user.username ,email:user.email },
          });
        }
  
        // Step 3: Insert user into database
        const newUser = {
          username: userName,
          email,
          password: null, // No password needed for Firebase users
          created_at: Math.floor(Date.now()),
          type: 1, // Different type for Firebase users
        };
  
        const query =
          "INSERT INTO users (id,username, email, password, created_at, type) VALUES ($1 , $2 , $3 , $4 , $5, $6) RETURNING id;";
          const values = [
            userId,
            newUser.username,
            newUser.email,
            newUser.password,
            newUser.created_at,
            newUser.type,
          ]
        connection.query(
          query,
          values,
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: "Error saving user", error: err });
            }
            const token = generateToken(result.rows[0].id);
  
            return res.status(200).json({
              message: "User Registered successfully!",
              token: token,
              user: { id: result.rows[0].id, username: userName,email:newUser.email },
            });
          }
        );
      });
    } catch (error) {
      return res.status(401).json({ message: "Invalid Firebase token", error: error.message });
    }
  };
  


 const loginUserWithGoogle = async (req, res) => {
    const { idToken } = req.body;
  
    try {
      
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { email } = decodedToken;
  
      if (!email) {
        return res.status(400).json({ message: "Invalid Firebase token: Email not found." });
      }
  
  
      checkUserExistence(null, email, (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Internal server error", error: err });
        }
  
        if (data?.rows?.length === 0) {
          return res.status(400).json({ message: "User does not exist." });
        }
  
        const user = data.rows[0];
        const token = generateToken(user.id);
  
        return res.status(200).json({
          message: "Login successful",
          token: token,
          user: { id: user.id, username: user.username },
        });
      });
    } catch (error) {
      return res.status(401).json({ message: "Invalid Firebase token", error });
    }
  };
  

  module.exports = { registerUserWithGoogle,loginUserWithGoogle };