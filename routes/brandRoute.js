const express=require('express');
const { createBrand, updateBrand, deleteBrand, getBrand, getAllBrand } = require('../controller/brandCtrl');
const { userMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router=express.Router();

router.post('/createBrand',userMiddleware,isAdmin,createBrand);
router.put('/updateBrand/:id',userMiddleware,isAdmin,updateBrand);
router.delete('/deleteBrand/:id',userMiddleware,isAdmin,deleteBrand);
router.get('/getBrand/:id',getBrand);
router.get('/getAllBrand',getAllBrand);



module.exports=router;