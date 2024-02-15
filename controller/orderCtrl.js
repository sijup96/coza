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
const orderid = require('order-id')('key');


// Load Thankyou Page
const loadThankyou = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decodedToken.id;
        const cartData = await cart.viewCart(accessToken)
        res.render('thankyou', { cartData })
    } catch (error) {
        throw new Error(error)

    }
});

//Load Order List
const orderList = asyncHandler(async (req, res) => {
    try {
        res.render('orderlist')
    } catch (error) {
        throw new Error(error)
    }
})
// Create a Order
const createOrder = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { totalPrice, selectedAddressId } = req.body;
        if (!totalPrice || !selectedAddressId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const userAddress = await Address.findById(selectedAddressId);
        if (!userAddress) {
            return res.status(400).json({ error: 'Invalid address' });
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
            return res.status(400).json({ error: 'Cart is empty' });
        }
        const unlistedProducts = cartData.products.filter(item => !item.product.is_listed);
        if (unlistedProducts.length > 0) {
            return res.status(400).json({ error: 'One or more products are unlisted' });
        }
        const id = orderid.generate();

        const order = new Order({
            user: userId,
            products: cartData.products,
            orderId: id,
            totalPrice:totalPrice,
            address: userAddress,
            orderby: userId
        });
        await order.save();
        cartData.products = [];
        cartData.cartTotal = 0;
        await cartData.save();
        res.status(200).json({ message: 'Order created successfully' });
    } catch (error) {
        console.error('Error creating order:', error);
        res.send(error)
    }
});


// Load Order List
const loadOrderList = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const orderList = await Order.find({ orderby: userId }).populate('products.product');
        console.log(orderList[0].products[0].product.title);
        res.render('orderlist', { orderList })
    } catch (error) {
        throw new Error(error)
    }
})


module.exports = { createOrder, loadOrderList, loadThankyou }