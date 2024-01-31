const User = require('../models/userModel');
const asyncHandler = require("express-async-handler")
const jwt = require('jsonwebtoken');
const Address = require('../models/addressModel')



//Load Address Page
const loadUserAddress = asyncHandler(async (req, res) => {
  const accessToken = req.accessToken
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const userData = await Address.find({user:userId}).populate('user')
    res.render('userAddresses', { userData });
  } catch (error) {
    throw new Error(error)
  }
});

//Load Create Address
const loadCreateAddress = asyncHandler(async (req, res) => {
  try {
    res.render('createAddress');
  } catch (error) {
    throw new Error(error)
  }
});

//Create Address
const createAddress = asyncHandler(async (req, res) => {
  try {
    const { name, mobile, houseName, street, landmark, pincode, city } = req.body;
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    console.log(req.body);
    console.log(userId);

    if (userId) {
      // Create new Address
      const newAddress = await Address.create({
        name,
        user: userId,
        mobile,
        houseName,
        street,
        landmark,
        pincode,
        city

      });
      console.log(newAddress);
      res.redirect('/user/address')
    } else {
      req.flash('head', `Try again.. `);
      // User already exists
      res.redirect('/user/address');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    throw new Error(error)
  }
});


module.exports = {
  loadUserAddress,
  loadCreateAddress,
  createAddress,
}