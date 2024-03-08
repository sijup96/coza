const express = require("express");
const router = express.Router();
const { loadWallet }=require('../controller/walletCtrl')

router.get("/",loadWallet)

module.exports = router;