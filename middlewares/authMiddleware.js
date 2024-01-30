const User=require('../models/userModel')
const jwt=require('jsonwebtoken')
const asyncHandler=require('express-async-handler');
const { Cookie } = require('express-session');


const userMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.refreshToken;
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      } else {
        req.flash('message','Authorized token expired, Please Login again')
        res.redirect("/login");
  
        throw new Error("There is no token attached to header");
      }
    } catch (error) {
      throw new Error("No Authorized token expired, Please Login again");
    }
  });

const isAdmin=asyncHandler(async(req,res,next)=>{
    try{
        const cookie = req.cookies
        if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
        const refreshToken = cookie.refreshToken
        const user = await User.findOne({ refreshToken })
    if(user.role=='admin'){
        next()
       
    }else{
        res.redirect('/admin');
    }
    }catch(error){
        res.redirect('/admin');
    }

});

const cacheControl=asyncHandler(async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache');
    next();
  });

module.exports={userMiddleware,isAdmin, cacheControl};