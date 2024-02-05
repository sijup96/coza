const Cart = require('../models/cartModel');
const Category = require('../models/prodCategoryModel')
const Product = require('../models/productModel')
const User = require('../models/userModel');
const Address = require('../models/addressModel')
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');
const slugify = require('slugify');
const jwt = require('jsonwebtoken');

// Load Cart Page
const loadCart = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decodedToken.id;
        const cartData = await viewCart(accessToken)
        const userAddress = await Address.find({ user: userId,default:true }).populate('user')
        res.render('cartPage', { cartData, userAddress })
    } catch (error) {
        throw new Error(error)
    }

});

//Create Cart Item
const addToCart = asyncHandler(async (req, res) => {
    try {
        const productId = req.body.productId;
        const quantity = req.body.quantity
        const accessToken = req.accessToken
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        const userId = decodedToken.id;

        // Find Product
        const selectedProduct = await Product.findById({ _id: productId })
        const price = selectedProduct.price * quantity
        // Check Cart is Exist
        const existingCart = await Cart.findOne({ userId: userId });
        if (existingCart) {
            // Check Product is Exist
            const existingProduct = existingCart.products.find(product => product.product.equals(productId));
            if (existingProduct) {
                return res.status(400).json({ error: 'Product already exists in the cart' });
            } else {
                // Add product to Existing Cart if product is not Exist
                existingCart.products.push({
                    product: productId,
                    quantity: quantity,
                    price: price,
                });
                await existingCart.save();
                return res.json({ message: 'Product added to the existing cart', cart: existingCart });

            }
        } else {
            // Save Item to cart
            const newCart = await new Cart({
                products: [{
                    product: productId,
                    quantity: quantity,
                    price: price,
                }],
                userId: userId,
            }).save()
            return res.json({ message: 'Product added to the cart', cart: newCart });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Delete Product From Cart
const deleteCartProduct = asyncHandler(async (req, res) => {
    try {
        const productId = req.params.productId;
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const existingCart = await Cart.findOne({ userId });
        if (existingCart) {
            // Remove the product from the cart
            existingCart.products = existingCart.products.filter(product => !product.product.equals(productId));
            await existingCart.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

// View Cart
const viewCart = async (accessToken) => {
    try {
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const cartData = await Cart.findOne({ userId }).populate('products.product');
        return cartData;
    } catch (error) {
        throw new Error(error);
    }
};

//Check Quantity
const checkQuantity = asyncHandler(async (req, res) => {
    console.log(req.body);
    res.status(500).json({ error: 'Internal Server Error' });
})


module.exports = {
    loadCart,
    addToCart,
    viewCart,
    deleteCartProduct,
    checkQuantity,
}