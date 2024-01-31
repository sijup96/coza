const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler');
const { Cookie } = require('express-session');
const { generateToken } = require('../config/jwtToken');


const userMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const cookie = req.cookies
    if (!cookie?.refreshToken) {
      req.flash('message', 'Authorized token expired, Please Login again')
      return res.redirect("/login");
    }
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (!user) {
      req.flash('message', 'No refresh Token present in DB or Not matched')
      return res.redirect("/login");
    }
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decode) => {
      if (err || user.id !== decode.id) {

        req.flash('message', 'Something wrong with refresh Token')
        return res.redirect("/login");
      }
      const accessToken = generateToken(user._id)
      req.accessToken = accessToken
      next()
    })
  } catch (error) {
    console.error('Error in userMiddleware:', error);
    next(error);
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (user.role == 'admin') {
      next()

    } else {
      res.redirect('/admin');
    }
  } catch (error) {
    res.redirect('/admin');
  }

});

const cacheControl = asyncHandler(async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  next();
});

module.exports = { userMiddleware, isAdmin, cacheControl };