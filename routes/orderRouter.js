const express = require("express");
const router = express.Router();
const { userMiddleware, isBlocked } = require("../middlewares/authMiddleware");
const {
  createOrder,
  loadThankyou,
  loadOrderList,
  loadOrderDetail,
  image,
  cancelOrder,
  verifyPayment,
  retryPayment,
} = require("../controller/orderCtrl");

router.post("/create", isBlocked, userMiddleware, createOrder);
router.post("/verifyPayment", isBlocked, userMiddleware, verifyPayment);
router.post("/retryPayment", isBlocked, userMiddleware, retryPayment);

router.get("/thankyou", userMiddleware, loadThankyou);

router.get("/list", isBlocked, userMiddleware, loadOrderList);
router.get("/detail", isBlocked, userMiddleware, loadOrderDetail);

router.post("/image", image);

router.patch("/cancel/:id", userMiddleware, cancelOrder);

module.exports = router;
