const express = require("express");
const verifyToken = require("../middlewares/auth");
const {uploadCategory, getCategories } = require("../controllers/categoriesController");
const { categoryValidator } = require("../middlewares/validator");
const { parseFormData } = require("../middlewares/imageUploader");
// const { validateProduct } = require("../middlewares/validator");

const router  = express.Router();

router.post("/",parseFormData,categoryValidator, uploadCategory);
// router.post("/",verifyToken,uploadProduct);

router.get("/",getCategories);




module.exports = router;