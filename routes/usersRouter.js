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
router.post("/createAddress", userMiddleware, createAddress);

router.get("/editAddress/:id", userMiddleware, loadEditAddress);
router.put("/editAddress/:id", userMiddleware, editAddress);

router.delete("/deleteAddress/:id", userMiddleware, deleteAddress);

router.put("/makeDefaultAddress/:id", userMiddleware, defaultAddress);

router.put("/profileIcon", userMiddleware, updateProfileIcon);




module.exports = router;