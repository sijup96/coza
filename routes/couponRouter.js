const express = require("express");
const router = express.Router();
const { isAdmin, isBlocked, userMiddleware } = require("../middlewares/authMiddleware");
const {
  loadCoupon,
  createCoupon,
  deleteCoupon,
  getACoupon,
  editCoupon,
  updateStatus,
  getAllCoupon,
  applyCoupon,
} = require("../controller/couponCtrl");

router.get("/", isAdmin, loadCoupon);
router.post("/create", isAdmin, createCoupon);
router.delete("/delete", isAdmin, deleteCoupon);
router.get("/getCoupon/:id", isAdmin, getACoupon);
router.put("/edit", isAdmin, editCoupon);
router.patch("/updateStatus", isAdmin, updateStatus);
router.get("/getAllCoupon", isBlocked,userMiddleware, getAllCoupon);
router.patch("/apply", isBlocked,userMiddleware, applyCoupon);


module.exports = router;
