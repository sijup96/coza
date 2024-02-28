const express = require('express');
const router = express.Router();
const { userMiddleware, isBlocked } = require('../middlewares/authMiddleware');
const { loadCart, addToCart, deleteCartProduct, checkQuantity, updateCart, loadCheckout } = require('../controller/cartCtrl')

router.get('/', userMiddleware, loadCart);
router.post('/add', userMiddleware,isBlocked, addToCart);
router.delete('/deleteProduct', userMiddleware, deleteCartProduct);
router.patch('/checkQuantity', userMiddleware, checkQuantity);
router.patch('/updateCart', userMiddleware, updateCart);
router.get("/checkout", isBlocked, userMiddleware, loadCheckout);



module.exports = router;