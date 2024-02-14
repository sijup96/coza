const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Category = require('../models/prodCategoryModel')
const Product = require('../models/productModel')
const User = require('../models/userModel');
const Address = require('../models/addressModel')
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');
const slugify = require('slugify');
const jwt = require('jsonwebtoken');
const cart = require('./cartCtrl')

const createOrder = asyncHandler(async (req, res) => {
    try {
        const { totalPrice, selectedAddressId } = req.body;

        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const userAddress = await Address.findById(selectedAddressId);
        const cartData = await cart.viewCart(accessToken);

        let flag = true;
        const product = [];
        if (cartData.cartTotal < 1) {
            return res.status(400).json({ error: 'One or more products are unlisted' });
        }
        // Check each product in the cart
        for (const item of cartData.products) {
            // If any product is unlisted, set flag to false
            if (item.product.is_listed === false) {
                flag = false;
                break; // Exit loop early if unlisted product found
            } else {
                product.push(item.product); // Add listed product to the product array
            }
        }

        // If all products are listed, proceed with order creation
        if (flag) {
            const order = new Order({
                user: userId,
                product: product,
                totalPrice: totalPrice,
                address: userAddress,
                orderby: userId
            });

            await order.save();
            cartData.products = [];
            cartData.cartTotal = 0;
            await cartData.save();
            res.status(201).json({ success: 'Order created successfully' });
        } else {
            // If any product is unlisted, return error
            res.status(400).json({ error: 'One or more products are unlisted' });
        }
    } catch (error) {
        // Handle any errors that occur during order creation
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const loadOrderDetail = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const orderDetails = Order.find({ orderby: userId })
        console.log(orderDetails.address);
        res.render('orderlist')
    } catch (error) {
        throw new Error(error)
    }
})


module.exports = { createOrder, loadOrderDetail, }