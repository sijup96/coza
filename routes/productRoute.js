const express=require('express')
const {createProduct, getProduct, getAllProduct, updateProduct, deleteProduct}=require('../controller/productCtrl')
const router=express.Router()
const {isAdmin,authMiddleware}=require('../middlewares/authMiddleware')



router.post('/createProduct',authMiddleware,isAdmin,createProduct);
router.get('/getProduct/:id',getProduct);
router.put('/updateProduct/:id',authMiddleware,isAdmin,updateProduct);
router.delete('/deleteProduct/:id',authMiddleware,isAdmin,deleteProduct);
router.get('/getAllProduct',getAllProduct);


module.exports=router;
