const mongoose = require("mongoose");

var cartSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
      },
    ],
    cartTotal: Number,
    couponId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponApplied: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
