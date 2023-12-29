const express=require('express');
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
    resetPassword} = require('../controller/userCtrl');
 const {authMiddleware,isAdmin}=require('../middlewares/authMiddleware')         
 const router=express.Router()
 router.post("/register",createUser);

 router.post("/forgot-password-token",forgotPasswordToken);
 router.patch("/reset-password/:token",resetPassword);
 router.put("/password",authMiddleware,updatePassword);

 router.post("/login",loginUserCtrl);
 router.get("/logout",logout)

 router.get("/getallusers",getAllUsers);
 router.get("/getuser/:id",authMiddleware,isAdmin,getUser);

 router.delete("/deleteuser/:id",deleteUser);
 router.put("/updateuser",authMiddleware,updateUser);

 router.put("/blockuser/:id",authMiddleware,isAdmin,blockUser);
 router.put("/unblockuser/:id",authMiddleware,isAdmin,unblockUser);

 router.get("/refresh",handleRefreshToken)
 

 module.exports=router