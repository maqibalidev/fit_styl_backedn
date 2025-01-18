const express = require("express");
const { registerUser, loginUser, getUser,resetPassword, getAllUser,forgotPassword, updateUser,verifyUser,verify } = require("../controllers/userControlelr");
const { validateUser, loginValidation, updateUserValidation } = require("../middlewares/validator");
const upload = require("../middlewares/imageUploader");
const verifyToken = require("../middlewares/auth");
const { registerUserWithGoogle, loginUserWithGoogle } = require("../controllers/firebaseAuthController");
const { rateLimiter } = require("../helpers/rateLimiter");
const rateLimits = require("../config/rateLimitConfig.json"); 
const router  = express.Router();


router.post("/register",validateUser,registerUser);

router.post("/login",loginValidation,loginUser);
router.post("/update", 
    verifyToken, 
    rateLimiter("updateUser", rateLimits.updateUser), // Use dynamic rate limit for updateUser route
    updateUser
  );
  
  router.post("/verify-user", 
    verifyToken, 
    rateLimiter("verifyUser", rateLimits.verifyUser), // Use dynamic rate limit for verifyUser route
    verifyUser
  );
  
  router.post("/forgot-password",  // Use dynamic rate limit for forgotPassword route
    forgotPassword
  );
  
  router.post("/reset-password", resetPassword
  );

router.post("/verify",verify);

router.post("/firebase/register",registerUserWithGoogle);

// router.post("/firebase/login",loginValidation,loginUserWithGoogle);

router.get("/",verifyToken,getUser);
router.get("/all",verifyToken,getAllUser);
module.exports = router;