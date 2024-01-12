const User=require('../models/userModel')
const jwt=require('jsonwebtoken')
const asyncHandler=require('express-async-handler');
const { Cookie } = require('express-session');


const authMiddleware=asyncHandler(async (req,res,next)=>{
    let token;

    if(req?.headers?.authorization?.startsWith('Bearer')){
        token=req.headers.authorization.split(' ')[1]
        try {
            if(token){
                const decoded=jwt.verify(token,process.env.JWT_SECRET)
                const user=await User.findById(decoded?.id)
                req.user=user
                console.log(req.user);
                
                next()
            }
            
        } catch (error) {
            throw new Error('Not Authorized token expired, please login again')
        }
    }else{
        res.render('index')
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

module.exports={authMiddleware,isAdmin, cacheControl};