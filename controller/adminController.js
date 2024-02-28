const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const asyncHandler = require("express-async-handler")
const { generateRefreshToken } = require('../config/refreshToken');
const Order = require('../models/orderModel')

//const category = require('../model/category')

//login page

const adminLogin = asyncHandler(async (req, res) => {
  try {
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache');

    // Extract cookies from the request
    const cookies = req.cookies;

    // Check if there is a refreshToken cookie
    if (!cookies || !cookies.refreshToken) {
      res.render('admin/adminLogin');
    } else {
      res.render('admin/admin');
    }
  } catch (error) {
    // Log the error for debugging
    console.error(error);

    // Redirect to adminLogin in case of an error
    res.redirect('/adminLogin');
  }
});

// admin dashboard

const adminDashboard = asyncHandler(async (req, res) => {

  try {
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache');

    // Extract cookies from the request
    const cookies = req.cookies;

    // Check if there is a refreshToken cookie
    if (!cookies || !cookies.refreshToken) {
      res.render('admin/adminLogin');
    } else {
      res.render('admin/admin');
    }
  } catch (error) {
    // Log the error for debugging
    console.error(error);

    // Redirect to adminLogin in case of an error
    res.redirect('/admin');
  }
});

//admin login

const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const findUser = await User.findOne({ email });

    if (findUser && findUser.role === 'admin' && (await findUser.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findUser?._id);

      // Update user's refresh token in the database
      const updateUser = await User.findByIdAndUpdate(
        findUser.id,
        { refreshToken },
        { new: true }
      );

      // Set a cookie with the refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      });

      // Render the "index" view
      res.render('admin/admin');
    } else {
      // Redirect to "/userLogin" for invalid credentials
      req.flash('message', 'Invalid credentials');
      res.render('admin/adminLogin');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    res.redirect('/adminLogin');
  }
});

// Logout

const logout = asyncHandler(async (req, res) => {
  try {


    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })

    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      return res.sendStatus(204)//forbidden

    }
    await User.findOneAndUpdate({ refreshToken: refreshToken }, {
      refreshToken: "",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    })
    res.redirect('/admin');

  } catch (error) {
    res.redirect('/adminLogin');
  }
});

//Load Orders
const loadOrders = asyncHandler(async (req, res) => {
  try {
    const orderList = await Order.find().populate({
      path: 'items',
      populate: {
        path: 'product_id',
        model: 'Product'
      }
    });
    res.render('admin/orders', { orderList })
  } catch (error) {
    throw new Error(error)
  }
});
//Load Order Details
const loadOrderDetail = asyncHandler(async (req, res) => {
  try {
    const orderId = req.query.orderId
    const orderDetail = await Order.findById({ _id: orderId }).populate({
      path: 'items',
      populate: {
        path: 'product_id',
        model: 'Product'
      }
    }).populate('user_id')
    res.render('admin/orderDetails', { orderDetail })
  } catch (error) {
    throw new Error(error)
  }
});
//Change Order Status
const changeOrderStatus = asyncHandler(async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;
    const orderDetail = await Order.findByIdAndUpdate({ _id: orderId }, {
      $set: {
        status: status
      }
    });
    if (orderDetail) {
      res.status(200).json({ success: true, message: 'Status saved successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Status Not saved' });
    }
  } catch (error) {
    console.error('Error changing order status:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



module.exports = { adminLogin, login, adminDashboard, logout, loadOrders, loadOrderDetail, changeOrderStatus }