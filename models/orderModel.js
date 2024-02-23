const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Make sure this matches the name of your User model
      // required: true,
    },
    orderId: {
      type: String
    },
    delivery_address: {},
    user_name: {
      type: String,
      // required: true,
    },
    total_amount: {
      type: Number,
      // required: true,
    },
    date: {
      type: String,
      // required: true,
    },
    expected_delivery: {
      type: String,
      // required: true,
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
        "Returned",
      ],
    },
    payment: {
      type: String,
      // required: true,
    },
    paymentId: {
      type: String,
    },
    totalDiscountAmount: {
      type: Number,
    },
    couponApplied: {
      type: Boolean,
    },
    coupon_name: {
      type: String,
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          // required: true,
        },
        orderId: {
          type: String
        },
        quantity: {
          type: Number,
          // required: true,
        },
        price: {
          type: Number,
          // required: true,
        },
        total_price: {
          type: Number,
          // required: true,
        },
        offerPercentage: {
          type: Number,
        },
        couponDiscountTotal: {
          type: Number,
        },
        ordered_status: {
          type: String,
          default: "placed",
        },
        cancellationReason: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);