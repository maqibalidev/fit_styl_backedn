const connection = require("../db/db_config");
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  checkUserExistence,
  hashPassword,
  comparePassword,
  generateToken,
} = require("../helpers/authHelpers");


// Register new user
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // Step 1: Check if user already exists
  checkUserExistence(username,email, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }
    if (data.length > 0) {
      return res.status(400).json({ message: "user already exists!" });
    }

    // Step 2: Hash the password
    hashPassword(password)
      .then((hashedPassword) => {
        const newUser = {
          username,
          email,
          password: hashedPassword,
          created_at: Math.floor(Date.now() / 1000),
          type: 0,
        };

        // Step 3: Insert user into database
        const query =
          "INSERT INTO users (username, email, password,created_at,type) VALUES (?, ?, ?,?,?)";
        connection.query(
          query,
          [
            newUser.username,     // username
            newUser.email,        // email
            newUser.password,     // hashedPassword
            newUser.created_at,   // created_at (timestamp in seconds)
            newUser.type          // type
          ],
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Error saving user", error: err });
            }
            return res
              .status(201)
              .json({
                message: "User registered successfully"
              });
          }
        );
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: "Error hashing password", error: err });
      });
  });
};

// Login user
const loginUser = (req, res) => {
  const { email, password } = req.body;

  // Step 1: Check if the user exists
  checkUserExistence(null,email, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }
    if (data.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Step 2: Compare the password
    const user = data[0];
    comparePassword(password, user.password)
      .then((isMatch) => {
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        // Step 3: Generate JWT token
        const token = generateToken(user.id);

        return res.status(200).json({
          message: "Login successful",
          token: token,
          user: { id: user.id, username: user.username,email:user.email },
        });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: "Invalid credentials", error: err });
      });
  });
};

// Get user profile
const getUser = (req, res) => {
  const id =  req.user.userId; // From JWT middleware

  // Step 1: Query the database for the user data
  const query = "SELECT * FROM users WHERE id = ?";
  connection.query(query, [id], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Send the user profile data
    res.status(200).json({
      user: {
        username: data[0].username,
        email: data[0].email,
        address: data[0].address,
        is_verified:data[0].is_verified
      },
    });
  });
};

const getAllUser = (req, res) => {
  const userId = req.user.userId;

  const query = "SELECT * FROM users WHERE user_id != ?";
  connection.query(query, [userId], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Users not found" });
    }

   
    res.status(200).json({
      data,
    });
  });
};



// authController.js
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Step 1: Check if the user exists
  checkUserExistence(null, email, async (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: `User with this email doesn't exist` });
    }

    // Step 2: Generate a JWT reset token (expires in 1 hour)
    const user = data[0];
   
    const resetToken = jwt.sign({email : user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Step 3: Create the password reset link
    const resetLink = `${process.env.FRONTEND_URL}reset-password?token=${resetToken}`;

    // Step 4: Configure Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail // CAN GET FROM GOOGLE ACCOUNT SETTINGS
      },
    });

    const mailOptions = {
      from: `"FitStyl Support" <${process.env.EMAIL_USER}>`, // Your app's email
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://res-console.cloudinary.com/dyurwayyj/media_explorer_thumbnails/9cb49098e7b254561423ca4c413a81e5/detailed" alt="Logo" style="width: 150px; margin-bottom: 20px;" />
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to reset it.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color:orange; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
          <p style="margin-top: 20px;">If you didn’t request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    };

    // Step 5: Send the email
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        message: `Password reset link sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .json({ message: "Failed to send reset email", error });
    }
  });
};


const resetPassword = async (req, res) => {
 
  const { password ,resetToken} = req.body;
  if (!resetToken) {
    return res.status(400).json({ message: "Reset token is required" });
  }

  if (!password) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    // Step 1: Verify the reset token and check expiry
    const {email} = jwt.verify(resetToken, process.env.JWT_SECRET);

    // Extract email from token
  
    
    if (!email) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Step 2: Hash the new password
    hashPassword(password)
    .then((hashedPassword) => {

  // Step 3: Update the user's password in the database
  updateUserPassword(email, hashedPassword, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `No user found` });
    }

    // Step 4: Return success response
    return res.status(200).json({
      message: "Password updated successfully",
    });
  });


    })

   

  
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Step 5: Handle token expiry
      return res.status(400).json({ message: "Reset token has expired" });
    }
console.log(error)
    return res.status(400).json({ message: "Invalid reset token", error });
  }
}


const updateUserPassword = (email, hashedPassword, callback) => {
  const sql = "UPDATE users SET password = ? WHERE email = ?";
  const values = [hashedPassword, email];

  connection.query(sql, values, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};



const updateUser = async (req, res) => {
  const user_id = req.user.userId;
  const { currentPassword, newPassword, username, address } = req.body;

  try {
    const query = "SELECT * FROM users WHERE id = ?";
    connection.query(query, [user_id], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error.", error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      const user = results[0]; // User record from the database
      let hashedPassword = user.password;

      // Step 2: If a password update is requested, validate the current password
      if (currentPassword && newPassword) {
        const isPasswordMatch = await comparePassword(currentPassword, user.password);
        if (!isPasswordMatch) {
          return res.status(401).json({ message: "Current password is incorrect." });
        }

        // Hash the new password
        hashedPassword = await bcrypt.hash(newPassword, 10);
      }

      // Step 3: Update user fields (username, address, and optionally password)
      const updateQuery = `
        UPDATE users 
        SET username = ?, address = ?, password = ? 
        WHERE id = ?
      `;
      const updateValues = [
        username || user.username,
        address || user.address,
        hashedPassword,
        user_id,
      ];

      connection.query(updateQuery, updateValues, (err, result) => {
        if (err) {
          console.error("Update error:", err);
          return res.status(500).json({ message: "Error updating user.", error: err });
        }

        return res.status(200).json({ message: "User updated successfully!" });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};




const verifyUser = (req,res)=>{
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Step 1: Check if the user exists
  checkUserExistence(null, email, async (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: `User with this email doesn't exist` });
    }
   else if (data[0].is_verified === 1) {
      return res.status(404).json({ message: `Account already verified!` });
    }
    // Step 2: Generate a JWT reset token (expires in 1 hour)
    const user = data[0];
   
    const resetToken = jwt.sign({email : user.email }, process.env.JWT_SECRET, {
      expiresIn: "1m",
    });

    // Step 3: Create the password reset link
    const resetLink = `${process.env.FRONTEND_URL}verify?token=${resetToken}`;

    // Step 4: Configure Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail // CAN GET FROM GOOGLE ACCOUNT SETTINGS
      },
    });

    const mailOptions = {
      from: `"FitStyl Support" <${process.env.EMAIL_USER}>`, // Your app's email
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://res-console.cloudinary.com/dyurwayyj/media_explorer_thumbnails/9cb49098e7b254561423ca4c413a81e5/detailed" alt="Logo" style="width: 150px; margin-bottom: 20px;" />
          <h2>Verify Your Email</h2>
          <p>Click the button below to verify your account.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color:orange; text-decoration: none; border-radius: 5px; margin-top: 20px;">Verify</a>
          <p style="margin-top: 20px;">If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    };

    // Step 5: Send the email
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        message: `Password reset link sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .json({ message: "Failed to send reset email", error });
    }
  });


}


const verify = (req,res)=>{
  const { token} = req.body;
  if (!token) {
    return res.status(400).json({ message: "Reset token is required" });
  }



  try {
    // Step 1: Verify the reset token and check expiry
    const {email} = jwt.verify(token, process.env.JWT_SECRET);

    // Extract email from token
  
    
    if (!email) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Step 2: Hash the new password

  // Step 3: Update the user's password in the database
  updateAccountVerification(email, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `No user found` });
    }

    // Step 4: Return success response
    return res.status(200).json({
      message: "Account verified!",
    });
  });

  
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Step 5: Handle token expiry
      return res.status(400).json({ message: "Reset token has expired" });
    }
    return res.status(400).json({ message: "Invalid reset token", error });
  }
}
const updateAccountVerification = (email, callback) => {
  const sql = "UPDATE users SET is_verified = ? WHERE email = ?";
  const values = [1, email];

  connection.query(sql, values, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

module.exports = { registerUser, loginUser, getUser, getAllUser,forgotPassword,resetPassword,updateUser ,verifyUser,verify};
