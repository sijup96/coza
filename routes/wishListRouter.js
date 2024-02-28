const express = require('express');
const router = express.Router();
const { userMiddleware, isBlocked } = require('../middlewares/authMiddleware');
const { updatewishList, loadWishlist } = require('../controller/wishListCtrl')

router.put("/update", isBlocked, userMiddleware, updatewishList);
router.get("/", isBlocked, userMiddleware, loadWishlist);


module.exports = router;