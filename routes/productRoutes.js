const express = require("express");
const {upload, validateImage, parseFormData} = require("../middlewares/imageUploader");
const verifyToken = require("../middlewares/auth");
const { uploadProduct,getProducts } = require("../controllers/productController");
const { validateProduct } = require("../middlewares/validator");

const router  = express.Router();

router.post("/", parseFormData, validateProduct, uploadProduct);
// router.post("/",verifyToken,uploadProduct);

router.get("/",getProducts);




module.exports = router;