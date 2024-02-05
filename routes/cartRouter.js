const express=require('express');
const router=express.Router();
const { userMiddleware } = require('../middlewares/authMiddleware');
const { loadCart, addToCart, deleteCartProduct, checkQuantity }=require('../controller/cartCtrl')

router.get('/',userMiddleware,loadCart);
router.post('/add',userMiddleware,addToCart);
router.delete('/deleteProduct/:productId',userMiddleware,deleteCartProduct);
router.post('/checkQuantity',userMiddleware,checkQuantity);



module.exports=router;