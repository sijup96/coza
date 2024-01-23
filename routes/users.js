const express = require('express');
const { createUser,
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
   userHome,
   userLogin,
   userRegister, 
   verifyOtp,sendOTP,
   } = require('../controller/userCtrl');
   const { authMiddleware, isAdmin, cacheControl } = require('../middlewares/authMiddleware');
   const router = express.Router()


   
   router.get("/register", userRegister);
