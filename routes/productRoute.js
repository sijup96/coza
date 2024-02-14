const express = require('express')
const { createProduct, getProduct, getAllProduct, updateProduct, deleteProduct, loadProductDetail, addToWishlist, loadProduct } = require('../controller/productCtrl')
const router = express.Router()
const { isAdmin, userMiddleware, accessToken } = require('../middlewares/authMiddleware')



router.get('/', accessToken, loadProduct);
router.get('/detail/:id', userMiddleware, loadProductDetail);

router.post('/createProduct', isAdmin, createProduct);
router.get('/getProduct/:id', getProduct);

router.put('/wishlist', userMiddleware, addToWishlist);

router.put('/updateProduct/:id', userMiddleware, isAdmin, updateProduct);

router.delete('/deleteProduct/:id', userMiddleware, isAdmin, deleteProduct);
router.get('/getAllProduct', getAllProduct);


module.exports = router;
