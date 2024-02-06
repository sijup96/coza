const express = require('express');
const { userAccount, updateUser, updateProfileIcon, loadCheckout } = require('../controller/userCtrl');
const { loadUserAddress, loadCreateAddress, createAddress, deleteAddress, defaultAddress, loadEditAddress, editAddress, } = require('../controller/addressCtrl');
   const { userMiddleware, cacheControl } = require('../middlewares/authMiddleware');
   const router = express.Router()


   router.post("/updateUser",userMiddleware, updateUser);
   router.get("/account",userMiddleware, userAccount);

   router.get("/address",userMiddleware, loadUserAddress);

   router.get("/createAddress",userMiddleware, loadCreateAddress);
   router.post("/createAddress",userMiddleware, createAddress);

   router.get("/editAddress/:id",userMiddleware, loadEditAddress);
   router.post("/editAddress/:id",userMiddleware, editAddress);
   router.delete("/deleteAddress/:id",userMiddleware, deleteAddress);
   router.put("/makeDefaultAddress/:id",userMiddleware, defaultAddress);
   router.put("/profileIcon",userMiddleware, updateProfileIcon);
   router.get("/checkout",userMiddleware, loadCheckout);

   

   module.exports = router;