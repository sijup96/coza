const Wallet= require('../models/walletModel')
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const validateMongoDbId = require('../utils/validateMongodbId');
const generateRazorpay = require("../config/generateRazorpay");
const crypto = require("crypto");


// Load Wallet
const loadWallet=asyncHandler(async (req,res)=>{
    try {
        res.render('wallet')
    } catch (error) {
        throw new Error(error)
    }
});
// Add to Wallet




module.exports={loadWallet}