const express = require("express");
const verifyToken = require("../middlewares/auth");
const { AddCartItem, UpdateCartItem, removeProductFromCart, getCartProducts } = require("../controllers/cartController");
const { cartValidator } = require("../middlewares/validator");

const router  = express.Router();


router.get("/",verifyToken,getCartProducts);
router.post("/",cartValidator,verifyToken,AddCartItem);
router.post("/update",cartValidator,verifyToken,UpdateCartItem);
router.post("/remove",verifyToken,removeProductFromCart);
module.exports = router;