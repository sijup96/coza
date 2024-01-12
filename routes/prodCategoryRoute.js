const express=require('express');
const { createCategory, updateCategory, deleteCategory, getCategory, getAllCategory } = require('../controller/productCategoryController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router=express.Router();

router.post('/createCategory',authMiddleware,isAdmin,createCategory);
router.put('/updateCategory/:id',authMiddleware,isAdmin,updateCategory);
router.delete('/deleteCategory/:id',authMiddleware,isAdmin,deleteCategory);
router.get('/getCategory/:id',getCategory);
router.get('/getAllCategory',getAllCategory);



module.exports=router;