const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler');
const { Cookie } = require('express-session');
const { generateToken } = require('../config/jwtToken');

//Checking User exist or not
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
//Pass accessToken if user Exist
const accessToken = asyncHandler(async (req, res, next) => {
  try {
    const cookie = req.cookies
    if (cookie) {
      const refreshToken = cookie.refreshToken
      const user = await User.findOne({ refreshToken })
      if (user) {
        const accessToken = generateToken(user._id)
        req.accessToken = accessToken
        next()
      } else {
        next()
      }

    } else
      next()

  } catch (error) {
    throw new Error(error)
  }

});

//Check IsAdmin
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

//Check Blocked Status
const isBlocked = asyncHandler(async (req, res, next) => {
  try {
    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (user.isBlocked === false) {
      next()

    } else {
      res.redirect('/');
    }
  } catch (error) {
    res.redirect('/');
  }

});

const cacheControl = asyncHandler(async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  next();
});

module.exports = { userMiddleware, isAdmin, cacheControl, accessToken, isBlocked };