const express = require('express');
const router = express.Router();
const { userMiddleware, isBlocked } = require('../middlewares/authMiddleware');
const { createOrder, loadThankyou, loadOrderList } = require('../controller/orderCtrl')


router.post('/create', userMiddleware, createOrder);
router.get('/thankyou', userMiddleware, loadThankyou);
router.get('/list', userMiddleware, loadOrderList);


module.exports = router;