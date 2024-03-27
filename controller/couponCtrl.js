const Coupon = require("../models/couponModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { json } = require("body-parser");
const voucher_codes = require("voucher-code-generator");
const jwt = require("jsonwebtoken");
const Cart = require("../models/cartModel");

// Load coupon
const loadCoupon = asyncHandler(async (req, res) => {
  const couponData = await Coupon.find().sort({ updatedAt: -1 });
  res.render("admin/coupons", { couponData });
});
// Create coupon
const createCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponName, discountAmount, couponDescription, expiryDate } =
      req.body;
    const generatedCodes = voucher_codes.generate({
      length: 6,
      count: 1,
    });
    const slug = slugify(req.body.couponName.toLowerCase());
    const couponCode = generatedCodes[0].toUpperCase();
    const existCouponCode = await Coupon.findOne({ couponCode });
    const existCouponName = await Coupon.findOne({ slug });

    if (existCouponCode) {
      return res.status(400).json({ message: "Coupon code already exist" });
    }
    if (existCouponName) {
      return res.status(400).json({ message: "Coupon Name already exist" });
    }
    const newCoupon = await Coupon.create({
      couponName,
      slug,
      couponCode,
      discountAmount,
      couponDescription,
      expiryDate,
    });
    if (newCoupon) {
      res.status(200).json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error.message);
  }
});
// Get A Coupon
const getACoupon = asyncHandler(async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponData = await Coupon.findById(couponId);
    if (couponData) {
      return res.status(200).json({ success: true, couponData: couponData });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
// Edit Coupon
const editCoupon = asyncHandler(async (req, res) => {
  try {
    const {
      couponId,
      couponName,
      discountAmount,
      couponDescription,
      expiryDate,
    } = req.body;
    const slug = slugify(req.body.couponName.toLowerCase());
    const existingCoupon = await Coupon.findOne({ slug: slug });
    console.log(existingCoupon);
    if (existingCoupon && existingCoupon._id.toString() !== couponId) {
      return res.status(400).json({ message: "Coupon name already exist.." });
    }
    const updateCoupon = await Coupon.findByIdAndUpdate(
      { _id: couponId },
      {
        $set: {
          couponName,
          slug,
          discountAmount,
          couponDescription,
          expiryDate,
        },
      },
      { new: true }
    );
    if (updateCoupon) {
      return res
        .status(200)
        .json({ success: true, message: "Coupon Updated successfully.." });
    }
  } catch (error) {
    res.status(500).json({ message: "Invalid Server" });
    console.error(error);
  }
});
// Delete Coupon
const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponId } = req.body;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (deletedCoupon) {
      return res
        .status(200)
        .json({ success: true, message: "Coupon deleted Successfully" });
    } else {
      return res.status(404).json({ message: "Coupon not found." });
    }
  } catch (error) {
    res.status(500);
    console.error(error);
  }
});
// List or Unlist Coupon
const updateStatus = asyncHandler(async (req, res) => {
  try {
    const { is_listed, couponId } = req.body;
    const updatedStatus = await Coupon.findByIdAndUpdate(
      {
        _id: couponId,
      },
      {
        $set: { is_listed: is_listed },
      },
      { new: true }
    );
    if (updatedStatus) {
      return res
        .status(200)
        .json({ success: true, message: "Status successfully updated" });
    } else {
      return res.status(404).json({ message: "Coupon not found" });
    }
  } catch (error) {
    res.status(500);
    console.error(error);
  }
});
// Get all coupons
const getAllCoupon = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const availableCoupons = await Coupon.find({ usersUsed: { $ne: userId } });
    if (availableCoupons) {
      return res.status(200).json({ success: true, coupons: availableCoupons });
    } else {
      return es.status(404).json({ message: "Coupons not available" });
    }
  } catch (error) {
    console.error(error);
  }
});
// Apply Coupon
const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const { couponCode } = req.body;

    const existingCoupon = await Coupon.findOne({ couponCode: couponCode });
    if(!existingCoupon){
      return res.status(404).json({message:'Enter a valid coupon code'})
    }
    if (existingCoupon && existingCoupon.usersUsed.includes(userId)) {
      return res.status(400).json({ message: "Coupon already used" });
    }
    const cartCheck = await Cart.findOne({ userId: userId });
    if (cartCheck.couponApplied) {
      return res.status(400).json({ message: "Coupon already used" });
    }
    const couponData = await Coupon.findOneAndUpdate(
      { couponCode: couponCode },
      {
        $addToSet: { usersUsed: userId },
      },
      {
        new: true,
      }
    );
    if (!couponData) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (couponData) {
      const cartData = await Cart.findOneAndUpdate(
        { userId: userId },
        { $set: { couponApplied: true, couponId: couponData._id } },
        { new: true }
      );
      console.log(cartData);
      res.json({
        success: true,
        message: "Coupon applied successfully!",
        couponData: couponData,
        cartTotal: cartData.cartTotal,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Remove Coupon
const removeCoupon = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    const cartData = await Cart.findOne({ userId: userId });
    const couponData = await Coupon.findById(cartData.couponId);
    if(!couponData){
      return res.status(400).json({message:'Coupon not Found.'})
    }
    
    // Remove the user's ID from the usersUsed array in the coupon database
    await Coupon.findByIdAndUpdate(
      cartData.couponId,
      { $pull: { usersUsed: userId } }
    );
    
    // Update the cart to remove the applied coupon
    const removedCoupon = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          couponApplied: false,
          couponId: null,
        },
      }
    );
    if (removedCoupon) {
      return res.status(200).json({ success: true, message: "Removed Successfully." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  loadCoupon,
  createCoupon,
  deleteCoupon,
  getACoupon,
  editCoupon,
  updateStatus,
  getAllCoupon,
  applyCoupon,
  removeCoupon,
};
