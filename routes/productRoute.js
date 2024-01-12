const express=require('express')
const {createProduct, getProduct, getAllProduct, updateProduct, deleteProduct, addToWishlist,loadProduct}=require('../controller/productCtrl')
const router=express.Router()
const {isAdmin,authMiddleware}=require('../middlewares/authMiddleware')



router.get('/',loadProduct);
router.post('/createProduct',authMiddleware,isAdmin,createProduct);
router.get('/getProduct/:id',getProduct);
router.put('/wishlist',authMiddleware,addToWishlist);

router.put('/updateProduct/:id',authMiddleware,isAdmin,updateProduct);

router.delete('/deleteProduct/:id',authMiddleware,isAdmin,deleteProduct);
router.get('/getAllProduct',getAllProduct);


module.exports=router;
