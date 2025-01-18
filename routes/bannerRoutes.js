const express = require("express");
const verifyToken = require("../middlewares/auth");
const {uploadBanner, getBanners } = require("../controllers/bannerController");
const { bannerValidator } = require("../middlewares/validator");
const { parseFormData } = require("../middlewares/imageUploader");
// const { validateProduct } = require("../middlewares/validator");

const router  = express.Router();

router.post("/",parseFormData,bannerValidator, uploadBanner);
// router.post("/",verifyToken,uploadProduct);

router.get("/",getBanners);




module.exports = router;