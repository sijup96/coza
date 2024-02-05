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
   verifyOtp, resendOTP, validateUser, loadVerifyEmailPage, loadCreatePassword,
} = require('../controller/userCtrl');
const { userMiddleware, cacheControl, accessToken } = require('../middlewares/authMiddleware');
const router = express.Router()



router.get("/", cacheControl,accessToken, userHome);
router.get("/register", cacheControl, userRegister);

router.post("/register", cacheControl, createUser);
router.patch("/validate", cacheControl, validateUser);

router.post("/verifyOTP", cacheControl, verifyOtp);
router.post("/resendOTP", cacheControl, resendOTP);

router.get("/forgotPassword", loadVerifyEmailPage);
router.get("/createPassword/:id", loadCreatePassword);

router.post("/forgotPassword", forgotPasswordToken);
router.post("/createPassword/:id", resetPassword);

router.patch("/reset-password/:token", resetPassword);
router.put("/password", userMiddleware, updatePassword);

router.get("/login", cacheControl, userLogin);
router.post("/login", cacheControl, loginUserCtrl);
router.get("/logout", cacheControl, logout)

router.delete("/deleteuser/:id", deleteUser);



router.get("/refresh", handleRefreshToken)


module.exports = router