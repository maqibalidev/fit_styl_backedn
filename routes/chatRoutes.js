const express = require("express");
const verifyToken = require("../middlewares/auth");
const { postChat, getAllChats } = require("../controllers/chatControllers");

const router  = express.Router();


// router.post("/register", upload.single('profile_img'), validateUser,registerUser);

// router.post("/login",loginValidation,loginUser);

// router.post("/",postChat);
router.get("/",getAllChats);

module.exports = router;