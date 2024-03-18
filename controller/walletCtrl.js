const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const validateMongoDbId = require("../utils/validateMongodbId");
const generateRazorpay = require("../config/generateRazorpay");
const crypto = require("crypto");
const { default: orderId } = require("order-id");
const orderid = require("order-id")("key");

// Load Wallet
const loadWallet = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    let wallet = await Wallet.findOne({ user: userId })
    .populate("user")
    .exec();
    if(wallet){
      wallet.transactions.sort((a, b) => b.transactionDate - a.transactionDate);
     return res.render("wallet", { wallet });
    }else{
      wallet = new Wallet({
        user: userId,
        balance: 0,
        transactions: [],
      });
      await wallet.save()
      return res.render("wallet", { wallet });

    }
  } catch (error) {
    throw new Error(error);
  }
});
// Add to Wallet
const addToWallet = asyncHandler(async (req, res) => {
  try {
    const paymentId = orderid.generate();
    const { amount } = req.body;
    generateRazorpay(paymentId, amount).then((paymentData) => {
      console.log(paymentData);
      res.json({ success: true, paymentData });
    });
  } catch (error) {
    throw new Error(error);
  }
});
// verify Payment
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    const paymentData = req.body;
    const razorpay_payment_id = paymentData["payment[razorpay_payment_id]"];
    const razorpay_order_id = paymentData["payment[razorpay_order_id]"];
    const razorpay_signature = paymentData["payment[razorpay_signature]"];
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature == razorpay_signature) {
      const amount = parseFloat(paymentData["amount[amount]"]) / 100;
      let userWallet = await Wallet.findOne({ user: userId });
      if (!userWallet) {
        userWallet = new Wallet({
          user: userId,
          balance: 0,
          transactions: [],
        });
      }
      userWallet.balance += amount;
      userWallet.transactions.push({
        type: "Credit",
        amount: amount,
        description: "Added money to wallet from Razorpay",
        paymentID: razorpay_payment_id,
      });
      await userWallet.save();
      res.status(200).json({ success: true, wallet: userWallet });

      // return res.json({ success: true });
    }
  } catch (error) {
    console.error(error);
  }
});
module.exports = { loadWallet, addToWallet, verifyPayment };
