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

//Load Order Detail
const loadOrderDetail = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const orderId = req.query.orderId;
        const orderDetail = await Order.findById({ _id: orderId }).populate({
            path: 'items',
            populate: {
                path: 'product_id',
                model: 'Product'
            }
        });
        console.log(orderDetail.delivery_address.city);
        res.render('orderDetail', { orderDetail })
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
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const userData = await User.findById(userId);
        const { totalPrice, selectedAddressId, paymentMethod, paymentId } = req.body;

        if (!totalPrice || !selectedAddressId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const delivery_address = await Address.findById(selectedAddressId);

        if (!delivery_address) {
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
        const orderItems = cartData.products.map(item => {
            let orderIdForItem = orderid.generate();
            return {
                product_id: item.product._id,
                orderId: orderIdForItem,
                quantity: item.quantity,
                price: item.product.price,
                total_price: item.quantity * item.product.price,
            };
        });
        const order = new Order({
            user_id: userId,
            orderId: orderid.generate(),
            delivery_address: delivery_address,
            user_name: userData.name,
            total_amount: totalPrice,
            date: new Date().toISOString(),
            expected_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            payment: paymentMethod,
            paymentId: paymentId,
            items: orderItems,


        });
        await order.save();
        for (const item of cartData.products) {
            await Product.updateOne(
                { _id: item.product._id },
                { $inc: { quantity: -item.quantity, sold: item.quantity } }
            );
        }


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
        const orderList = await Order.find({ user_id: userId }).populate({
            path: 'items',
            populate: {
                path: 'product_id',
                model: 'Product'
            }
        });
        res.render('orderlist', { orderList })
    } catch (error) {
        throw new Error(error)
    }
});
// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decodedToken.id;
        const orderId = req.params.id;
        const cancledOrder = await Order.findByIdAndUpdate(orderId, {
            status: 'Cancled'
        });
        if (cancledOrder) {
            res.status(200).json({ success: true, message: 'Order canceled successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found or could not be canceled' });
        }
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ success: false, message: 'An error occurred while canceling the order' });

    }
});




const image = asyncHandler(async (req, res) => {
    const { image } = req.body
    console.log('hii', image);
})

module.exports = { createOrder, loadOrderList, loadThankyou, loadOrderDetail, cancelOrder, image }