const { body, validationResult, check } = require("express-validator");

// Middleware to validate user input (username, email, password)
const validateUser = [
  // Username: Must be between 3 to 20 characters long
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters"),

  // Email: Must be a valid email
  body("email").isEmail().withMessage("Please enter email address"),

  // Password: Must contain at least 1 digit, 1 letter, 1 special char, and be at least 8 characters long
  body("password")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage(
      "Password must be at least 8 characters long, contain at least one digit, and one special character"
    ),

  // Confirm password: Must match password
  body("confirmPass")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Password and Confirm Password do not match"),

  // Middleware to check validation result
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
const loginValidation = [
  // Email: Must be a valid email
  body("email").isEmail().withMessage("Please enter a valid email address"),

  // Password: Must contain at least 1 digit, 1 letter, 1 special char, and be at least 8 characters long
  body("password")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage(
      "Password must be at least 8 characters long, contain at least one letter, one digit, and one special character"
    ),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const updateUserValidation = [
  // Validate currentPassword, newPassword, and confirm_password as a group
  body(["currentPassword", "newPassword", "confirmPass"]).custom(
    (value, { req }) => {
      const { currentPassword, newPassword, confirmPass } = req.body;

      // Check if any of the three fields is provided
      const anyFieldProvided =
        currentPassword || newPassword || confirmPass;

      // If any field is provided, ensure all three are present and valid
      if (anyFieldProvided) {
        if (!currentPassword) throw new Error("Current password is required");
        if (!newPassword) throw new Error("New password is required");
        if (!confirmPass) throw new Error("Confirm password is required");
        if (currentPassword === newPassword) throw new Error("New password cannot be the same as the current password.");
        if (newPassword !== confirmPass)
          throw new Error("Confirm password must match the new password");
      }

      // If no field is provided, no errors (all fields are optional)
      return true;
    }
  ),

  // username: Optional but must be a string if provided
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string"),

  // address: Optional but must be a string if provided
  body("address").optional().isString().withMessage("Address must be a string"),

  // Validation error handling middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware to validate product fields
const validateProduct = [
  // Name: Must be a string and not empty
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name cannot be empty"),

  // Description: Must be a string and not empty
  body("desc")
    .isString()
    .withMessage("Description must be a string")
    .notEmpty()
    .withMessage("Description cannot be empty"),

  // Price: Must be an integer and not null
  body("price")
    .isInt()
    .withMessage("Price must be an integer")
    .notEmpty()
    .withMessage("Price cannot be null"),

  // Off Sale: Must be an integer and not null
  body("off_sale")
    .isInt()
    .withMessage("Off Sale must be an integer")
    .notEmpty()
    .withMessage("Off Sale cannot be null"),

  // Rating: Must be an integer and not null
  body("rating")
    .isInt()
    .withMessage("Rating must be an integer")
    .notEmpty()
    .withMessage("Rating cannot be null"),

  // Priority: Must be an integer and not null
  body("priority")
    .isInt()
    .withMessage("Priority must be an integer")
    .notEmpty()
    .withMessage("Priority cannot be null"),

  // Fabric Type: Optional but must be a string if provided
  body("fabric_type")
    .optional()
    .isString()
    .withMessage("Fabric Type must be a string"),

  // Colors: Cannot be null (assuming it is an array or string)
  body("colors").notEmpty().withMessage("Colors cannot be null"),

  // Size: Cannot be null (assuming it is an array or string)
  body("size").notEmpty().withMessage("Size cannot be null"),

  // Returnable: Must be a boolean
  body("returnable")
    .isBoolean()
    .withMessage("Returnable must be a boolean value (true or false)"),

  // Shop ID: Must be an integer and not null
  body("shop_id")
    .isInt()
    .withMessage("Shop ID must be an integer")
    .notEmpty()
    .withMessage("Shop ID cannot be null"),

  // Margin: Must be an integer and not null
  body("margin")
    .isInt()
    .withMessage("Margin must be an integer")
    .notEmpty()
    .withMessage("Margin cannot be null"),
  body("category_id")
    .isInt()
    .withMessage("category_id must be an integer")
    .notEmpty()
    .withMessage("Margin cannot be null"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const categoryValidator = [
  // Name: Must be a string and not empty
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name cannot be empty"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const bannerValidator = [
  body("heading")
    .isString()
    .withMessage("heading must be a string")
    .notEmpty()
    .withMessage("heading cannot be empty"),

  // Description: Must be a string and not empty
  body("desc")
    .isString()
    .withMessage("Description must be a string")
    .notEmpty()
    .withMessage("Description cannot be empty"),

  // Price: Must be an integer and not null
  body("title")
    .isString()
    .withMessage("title must be an string")
    .notEmpty()
    .withMessage("title cannot be null"),

  body("product_id")
    .isInt()
    .withMessage("product_id must be an integer")
    .notEmpty()
    .withMessage("product_id cannot be null"),

  // Priority: Must be an integer and not null
  body("priority")
    .isInt()
    .withMessage("Priority must be an integer")
    .notEmpty()
    .withMessage("Priority cannot be null"),
];


const cartValidator = [
  body("product_id")
  .isString()
  .withMessage("product_id must be a string")
  .notEmpty()
  .withMessage("product_id cannot be empty"),

  body("quantity")
  .isNumeric()
  .withMessage("quantity must be a number")
  .notEmpty()
  .withMessage("quantity cannot be empty"),
  
];

module.exports = {
  validateUser,
  loginValidation,
  validateProduct,
  categoryValidator,
  bannerValidator,
  updateUserValidation,
  cartValidator
};
