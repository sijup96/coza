const express=require('express');
const { createCategory, updateCategory } = require('../controller/prodCategoryCtrl');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router=express.Router();

router.post('/createCategory',authMiddleware,isAdmin,createCategory);
router.put('/updateCategory/:id',authMiddleware,isAdmin,updateCategory);



module.exports=router;