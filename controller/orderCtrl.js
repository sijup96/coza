const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");
const jwt = require("jsonwebtoken");
const cart = require("./cartCtrl");
const orderid = require("order-id")("key");
const generateRazorpay = require("../config/generateRazorpay");
const crypto = require("crypto");
const { calculateDistance } = require("./mapCtrl");
const Wallet = require("../models/walletModel");
const { log } = require("console");
const Category = require("../models/categoryModel");

// Load Thankyou Page
const loadThankyou = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const cartData = await cart.viewCart(accessToken);
    res.render("thankyou", { cartData });
  } catch (error) {
    throw new Error(error);
  }
});

//Load Order Detail
const loadOrderDetail = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const orderId = req.query.orderId;
    const orderDetail = await Order.findById({ _id: orderId })
      .populate({
        path: "items",
        populate: {
          path: "product_id",
          model: "Product",
        },
      })
      .sort({ date: -1 });
    res.render("orderDetail", { orderDetail });
  } catch (error) {
    throw new Error(error);
  }
});
// Create a Order
const createOrder = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const userData = await User.findById(userId);
    const walletDetails = await Wallet.findOne({ user: userId });

    const { selectedAddressId, paymentMethod, usingWallet } = req.body;
    if (!selectedAddressId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const delivery_address = await Address.findById(selectedAddressId);
    const distanceText = await calculateDistance(delivery_address.pincode);
    if (!delivery_address) {
      return res.status(400).json({ error: "Invalid address" });
    }
    const cartData = await cart.viewCart(accessToken);
    const isValidCart = cartData.products.every((productItem) => {
      return (
        productItem.quantity > 0 &&
        productItem.quantity <= productItem.product.quantity &&
        productItem.product.is_listed === true
      );
    });

    if (!isValidCart || cartData.cartTotal <= 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    const unlistedProducts = cartData.products.filter(
      (item) => !item.product.is_listed
    );
    if (unlistedProducts.length > 0) {
      return res
        .status(400)
        .json({ error: "One or more products are unlisted" });
    }
    const numericalDistance = parseInt(distanceText.split(" ")[0]);
    let shippingCharge = 0;
    if (cartData.cartTotal < 1000) {
      if (numericalDistance > 20 && numericalDistance <= 50) {
        shippingCharge = 50;
      } else if (numericalDistance > 50 && numericalDistance <= 100) {
        shippingCharge = 70;
      } else if (numericalDistance > 100) {
        shippingCharge = 100;
      }
    }
    const orderItems = cartData.products.map((item) => {
      let orderIdForItem = orderid.generate();
      return {
        product_id: item.product._id,
        orderId: orderIdForItem,
        quantity: item.quantity,
        price: item.price,
        total_price: item.quantity * item.price,
      };
    });
    const couponPrice = parseFloat(
      cartData.couponId ? cartData.couponId.discountAmount : "0"
    );
    const order = new Order({
      user_id: userId,
      orderId: orderid.generate(),
      delivery_address: delivery_address,
      user_name: userData.name,
      total_amount: cartData.cartTotal + shippingCharge - couponPrice,
      shippingCharge: shippingCharge,
      couponAmount: couponPrice,
      date: new Date().toISOString(),
      expected_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: orderItems,
    });
    const placedOrder = await order.save();
    const placedOrderId = placedOrder.orderId;
    for (const item of cartData.products) {
      await Product.updateOne(
        { _id: item.product._id },
        { $inc: { quantity: -item.quantity, sold: item.quantity } }
      );
    }
    cartData.products = [];
    cartData.cartTotal = 0;
    cartData.couponId = null;
    cartData.couponApplied = false;
    await cartData.save();
    if (paymentMethod === "Cash on Delivery") {
      await Order.findOneAndUpdate(
        { orderId: placedOrderId },
        {
          $set: {
            payment: "Cash on Delivery",
          },
        }
      );
      return res.json({ codSuccess: true });
    } else if (paymentMethod === "Wallet") {
      const walletBalance = walletDetails.balance - placedOrder.total_amount;
      const paymentId = orderid.generate();
      await Order.findOneAndUpdate(
        { orderId: placedOrderId },
        {
          $set: {
            payment: paymentMethod,
          },
        }
      );
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            balance: walletBalance,
          },
        }
      );
      const newTransaction = {
        type: "Debit",
        amount: placedOrder.total_amount,
        description: "Purchased Dress using Wallet",
        paymentID: paymentId,
      };
      await Wallet.findOneAndUpdate(
        { user: userId },
        { $push: { transactions: newTransaction } },
        { new: true }
      );
      await Order.findByIdAndUpdate(placedOrder._id, {
        $set: {
          payment: "Wallet",
          paymentStatus: "Completed",
          paymentId: paymentId,
        },
      });
      return res.json({ wallet: true });
    } else {
      let payableAmount = placedOrder.total_amount;
      if (usingWallet === "true") {
        payableAmount = placedOrder.total_amount - walletDetails.balance;
      }
      generateRazorpay(placedOrder.orderId, payableAmount).then((orderData) => {
        res.json({ online: true, orderData });
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.send(error);
  }
});
// Verify Payment
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const { usingWallet } = req.body;
    const paymentData = req.body;
    const razorpay_payment_id = paymentData["payment[razorpay_payment_id]"];
    const razorpay_order_id = paymentData["payment[razorpay_order_id]"];
    const razorpay_signature = paymentData["payment[razorpay_signature]"];
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const orderId = paymentData["order[receipt]"];

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (generated_signature == razorpay_signature) {
      await Order.findOneAndUpdate(
        { orderId: orderId },
        {
          $set: {
            payment: "Online",
            paymentStatus: "Completed",
            paymentId: razorpay_payment_id,
          },
        }
      );
      if (usingWallet) {
        const walletData = await Wallet.findOne({ user: userId });
        const newTransaction = {
          type: "Debit",
          amount: walletData.balance,
          description: "Purchased Dress using Wallet and online Payment",
          paymentID: orderid.generate(),
        };
        await Wallet.findOneAndUpdate(
          { user: userId },
          { $push: { transactions: newTransaction } },
          { new: true }
        );
        await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $set: {
              balance: 0,
            },
          }
        );
        return res.json({ success: true });
      }
      return res.json({ success: true });
    }
  } catch (error) {
    console.error(error);
  }
});
// Retry Payment
const retryPayment = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const { orderId } = req.body;
    const orderDetail = await Order.findById(orderId);
    if (orderDetail) {
      generateRazorpay(orderDetail.orderId, orderDetail.total_amount).then(
        (orderData) => {
          res.json({ success: true, orderData });
        }
      );
    }
  } catch (error) {
    throw new Error(error);
  }
});
const loadOrderList = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const page = req.query.page || 1; // Default to page 1 if not provided
    const limit = 8; // Number of items per page
    const skip = (page - 1) * limit;
    
    // Query orders based on user ID and populate items with product details
    const orderList = await Order.find({ user_id: userId })
      .populate({
        path: "items",
        populate: {
          path: "product_id",
          model: "Product",
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total number of orders
    const totalOrderCount = await Order.countDocuments({ user_id: userId });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalOrderCount / limit);

    res.render("orderlist", {
      orderList,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const orderId = req.params.id;
    const cancledOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "Cancelled",
      },
      { new: true }
    );
    if (cancledOrder) {
      if (cancledOrder.paymentStatus === "Completed") {
        const balanceUpdated = await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $inc: {
              balance: cancledOrder.total_amount - cancledOrder.shippingCharge,
            },
          }
        );
        if (balanceUpdated) {
          const newTransaction = {
            type: "Credit",
            amount: cancledOrder.total_amount - cancledOrder.shippingCharge,
            description: "Money was credited from cancelled Order",
            paymentID: orderid.generate(),
          };
          await Wallet.findOneAndUpdate(
            { user: userId },
            { $push: { transactions: newTransaction } },
            { new: true }
          );
        }
      }
      for (const item of cancledOrder.items) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { quantity: item.quantity },
        });
      }
      res
        .status(200)
        .json({ success: true, message: "Order canceled successfully" });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found or could not be canceled",
      });
    }
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while canceling the order",
    });
  }
});
//Return Order
const returnOrder = asyncHandler(async (req, res) => {
  try {
    const orderId = req.params.id;
    const returnRequest = await Order.findByIdAndUpdate(orderId, {
      $set: {
        status: "Return Requested",
      },
    });
    if (returnRequest) {
      return res
        .status(200)
        .json({ success: true, message: "Return request send Successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.error(error);
  }
});
const image = asyncHandler(async (req, res) => {
  const { image } = req.body;
  console.log("hii", image);
});
// Search & Filter Order
const filterOrder = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const { searchQuery, statusFilter } = req.body;

    // Query orders based on user ID and populate items with product details
    const orderList = await Order.find({ user_id: userId })
      .populate({
        path: "items",
        populate: {
          path: "product_id",
          model: "Product",
        },
      })
      .sort({ date: -1 });

    // Filter orders based on search query and status filter
    const filteredOrders = orderList.filter((order) => {
      // Match order ID with search query (case-insensitive)
      const orderIdMatch = order.orderId
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Match order status with status filter
      const statusMatch = statusFilter === "" || order.status === statusFilter;
      return orderIdMatch && statusMatch;
    });

    // Send the filtered order list as response
    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error("Error filtering orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  createOrder,
  loadOrderList,
  loadThankyou,
  loadOrderDetail,
  cancelOrder,
  image,
  verifyPayment,
  retryPayment,
  returnOrder,
  filterOrder,
};
