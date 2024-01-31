const express = require('express');
const { userAccount, updateUser } = require('../controller/userCtrl');
const { loadUserAddress, loadCreateAddress, createAddress } = require('../controller/addressCtrl');
   const { userMiddleware, cacheControl } = require('../middlewares/authMiddleware');
   const router = express.Router()


   
   router.get("/account",userMiddleware, userAccount);

   router.get("/address",userMiddleware, loadUserAddress);
   router.get("/createAddress",userMiddleware, loadCreateAddress);
   router.post("/createAddress",userMiddleware, createAddress);

   router.post("/updateUser",userMiddleware, updateUser);

   module.exports = router;