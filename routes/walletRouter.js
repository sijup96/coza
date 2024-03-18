const express = require("express");
const router = express.Router();
const {
  loadWallet,
  addToWallet,
  verifyPayment,
} = require("../controller/walletCtrl");
const { userMiddleware, isBlocked } = require("../middlewares/authMiddleware");

router.get("/", userMiddleware, isBlocked, loadWallet);
router.post("/addMoney", userMiddleware, isBlocked, addToWallet);
router.post("/verifyPayment", userMiddleware, isBlocked, verifyPayment);

module.exports = router;
