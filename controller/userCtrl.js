const { generateToken } = require('../config/jwtToken');
const User=require('../models/userModel')
const asyncHandler=require("express-async-handler")
const validateMongoDbId=require('../utils/validateMongodbId')
const {generateRefreshToken}=require('../config/refreshToken');
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const sendEmail=require('./emailCtrl')
const crypto=require('crypto');

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({email:email}); // Corrected the query format
  
    if (!findUser) {

      // Create new user

      const newUser = await User.create(req.body);
      res.json(newUser);
    } else {

      // User already exists

     throw new Error("User already Exists")
    }
  })


const loginUserCtrl= asyncHandler(async(req,res)=>{
    const {email, password}=req.body

   //check if user exist or not

   const findUser= await User.findOne({email});
   if((findUser && await findUser.isPasswordMatched(password))){
    const refreshToken= await generateRefreshToken(findUser?._id)
    const updateUser=await User.findByIdAndUpdate(findUser.id,{
      refreshToken:refreshToken,
    },{new:true});

    res.cookie("refreshToken",refreshToken,{
      httpOnly:true,
      maxAge:72*60*60*1000
    });

    res.json({
      _id:findUser?._id,
      name:findUser?.name,
      email:findUser?.email,
      mobile:findUser?.mobile,
      token:generateToken(findUser?._id)
    });
   }else{
    throw new Error('Invalid Credentials');
   }
});

//Handle refresh Token

const handleRefreshToken= asyncHandler(async(req,res)=>{
const cookie=req.cookies
if(!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
const refreshToken=cookie.refreshToken
const user=await User.findOne({refreshToken})
if(!user) throw new Error("No refresh Token present in DB or Not matched")
jwt.verify(refreshToken,process.env.JWT_SECRET,(err,decode)=>{
  if(err||user.id!=decode.id){
    throw new Error("Something wrong with refresh Token")
  }
  const accessToken=generateToken(user?._id)
  res.json({accessToken})
})
});

//Logout functionality

const logout=asyncHandler(async(req,res)=>{
  const cookie=req.cookies
  if(!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
  const refreshToken=cookie.refreshToken
  const user=await User.findOne({refreshToken})
  if(!user){
    res.clearCookie("refreshToken",{
      httpOnly:true,
      secure:true,
    });
    return res.sendStatus(204)//forbidden
  }
  await User.findOneAndUpdate({ refreshToken: refreshToken }, {
    refreshToken: "",
  });
res.clearCookie("refreshToken",{
  httpOnly:true,
  secure:true,
})
res.sendStatus(204)//forbidden
});

//Update a User

const updateUser=asyncHandler(async (req,res)=>{
  const {_id}=req.user
try {
  const updatedUser=await User.findByIdAndUpdate(
    _id,
    {
      name:req?.body?.name,
      email:req?.body?.email,
      mobile:req?.body?.mobile,
    },
    {
      new:true
    }
    
  )
 res.json(updatedUser)
} catch (error) {
  throw new Error(error)
}
});

   //Get all Users

   const getAllUsers=asyncHandler(async(req,res)=>{
    try {
      const getUser= await User.find();
      res.json(getUser);
    } catch (error) {
      throw new Error(error);
      
    }
   });
   //Get a single User

   const getUser=asyncHandler(async(req,res)=>{
    const{id}=req.params
   
    try {
      const getaUser=await User.findById(id)
      res.json({getaUser})
    } catch (error) {
      throw new Error(error)
    }
   });

      //Delete a User

      const deleteUser=asyncHandler(async(req,res)=>{
        const{id}=req.params
       console.log(id);
        try {
          const deleteaUser=await User.findByIdAndDelete({_id:id})
          console.log(deleteaUser);
          res.json({deleteaUser})
        } catch (error) {
          throw new Error(error)
        }
       });

       const blockUser=asyncHandler(async(req,res)=>{
        const {id}=req.params
        try {
          const block= await User.findByIdAndUpdate({_id:id},
            {
              isBlocked:true,
            },{
              new:true
            })
            res.json({
              message:"User Blocked"
            })
        } catch (error) {
          throw new Error(error)
          
        }
       });

       const unblockUser=asyncHandler(async(req,res)=>{
        const {id}=req.params
        try {
          const unblock= await User.findByIdAndUpdate(id,
            {
              isBlocked:false,
            },{
              new:true
            })
            res.json({
              message:"User UnBlocked"
            })
        } catch (error) {
          throw new Error(error)
          
        }

       });

//Update Password

const updatePassword=asyncHandler(async(req,res)=>{
  const {_id}=req.user;
  const {password}=req.body;
  try{
    validateMongoDbId(_id)
    const user=await User.findById(_id)
    if(password){
      user.password=password;
      const updatedPassword=await user.save()
      console.log(updatedPassword);
      res.json(updatedPassword)
    }else{
      res.json(user)
    }
  }catch(error){
    throw new Error(error)
  }

});

//Forgot Password Token

const forgotPasswordToken=asyncHandler(async(req,res)=>{
  const {email}=req.body
  const user=await User.findOne({email})
  if(!user) throw new Error('User not found with this email')
  try {
    const token=await user.createPasswordResetToken()
    await user.save();
    const resetURL=`Link to reset password (10 minute) <a href="http://localhost:3000/api/user/reset-password/${token}">Click here</>`
const data={
  to:email,
  text:'Hey User',
  subject:'Forgot password Link',
  htm:resetURL,
}
sendEmail(data);
res.json(token)

  } catch (error) {
    throw new Error(error)
  }
});

//reset Password

const resetPassword=asyncHandler(async(req,res)=>{
  const {password}=req.body;
  const {token}=req.params;
  const hashedToken=crypto.createHash("sha256").update(token).digest("hex")
  const user=await User.findOne({
    passwordResetToken:hashedToken,
    passwordResetExpires:{$gt:Date.now()},
  })
if(!user) throw new Error('Token Expired Please try again later')
user.password=password;
user.passwordResetToken=undefined;
user.passwordResetExpires=undefined;
await user.save()
res.json(user);

});


module.exports={createUser,
  loginUserCtrl,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
}