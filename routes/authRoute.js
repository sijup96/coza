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
   verifyOtp,sendOTP, resendOTP, validateUser,
   } = require('../controller/userCtrl');
const { authMiddleware, isAdmin, cacheControl } = require('../middlewares/authMiddleware');
const router = express.Router()



router.get("/",cacheControl,userHome);
router.get("/register", userRegister);
router.post("/register",createUser);
router.post("/validate",validateUser);

router.post("/verifyOTP",verifyOtp);
router.post("/resentOTP",resendOTP);

router.post("/forgot-password-token", forgotPasswordToken);
router.patch("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);

router.get("/login", cacheControl,userLogin);
router.post("/login",cacheControl,loginUserCtrl);
router.get("/logout",cacheControl, logout)

router.get("/getallusers", getAllUsers);
router.get("/getuser/:id", authMiddleware, isAdmin, getUser);

router.delete("/deleteuser/:id", deleteUser);
router.put("/updateuser", authMiddleware, updateUser);

router.put("/blockuser/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblockuser/:id", authMiddleware, isAdmin, unblockUser);

router.get("/refresh", handleRefreshToken)


module.exports = router