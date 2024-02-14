const express = require('express');
const router = express.Router();
const { userMiddleware, isBlocked } = require('../middlewares/authMiddleware');
const { createOrder, loadOrderDetail } = require('../controller/orderCtrl')


router.post('/create', userMiddleware, createOrder);
router.get('/detail', userMiddleware, loadOrderDetail);


module.exports = router;