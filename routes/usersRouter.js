const express = require('express');
const { userAccount, updateUser, updateProfileIcon } = require('../controller/userCtrl');
const { loadUserAddress, loadCreateAddress, createAddress, deleteAddress, defaultAddress, loadEditAddress, editAddress, getAddress, } = require('../controller/addressCtrl');
const { userMiddleware, cacheControl, isBlocked } = require('../middlewares/authMiddleware');
const router = express.Router()

router.get("/account", userMiddleware, userAccount);
router.post("/updateUser", isBlocked, userMiddleware, updateUser);

router.get("/address", userMiddleware, loadUserAddress);
router.get("/getAddress/:id", userMiddleware, getAddress);

router.get("/createAddress", userMiddleware, loadCreateAddress);
router.post("/createAddress",isBlocked, userMiddleware, createAddress);

router.get("/editAddress/:id", userMiddleware, loadEditAddress);
router.put("/editAddress/:id",isBlocked, userMiddleware, editAddress);

router.delete("/deleteAddress/:id",isBlocked, userMiddleware, deleteAddress);

router.put("/makeDefaultAddress/:id", userMiddleware, defaultAddress);

router.put("/profileIcon", userMiddleware, updateProfileIcon);




module.exports = router;