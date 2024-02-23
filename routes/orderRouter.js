const express = require('express');
const router = express.Router();
const { userMiddleware, isBlocked } = require('../middlewares/authMiddleware');
const { createOrder, loadThankyou, loadOrderList, loadOrderDetail, image, cancelOrder } = require('../controller/orderCtrl')


router.post('/create', userMiddleware, createOrder);
router.get('/thankyou', userMiddleware, loadThankyou);

router.get('/list', userMiddleware, loadOrderList);
router.get('/detail', userMiddleware, loadOrderDetail);

router.post('/image', image);

router.patch('/cancel/:id', userMiddleware, cancelOrder);


module.exports = router;