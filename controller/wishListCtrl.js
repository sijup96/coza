const Wishlist = require('../models/wishListModel')
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const validateMongoDbId = require('../utils/validateMongodbId');
const Product = require('../models/productModel')


// Load Wishlist
const loadWishlist = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const userWishlist =await Wishlist.findOne({ userId }).populate('products.product')
        res.render('wishlist', {userWishlist})
    } catch (error) {
        throw new Error(error)
    }
})
// Add or Remove Wishlist
const updatewishList = asyncHandler(async (req, res) => {
    try {
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        const productId = req.body.productId;
        const product = await Product.findById(productId);
        const price = product.price;
        let existingWishList = await Wishlist.findOne({ userId });

        if (!existingWishList) {
            existingWishList = await new Wishlist({
                products: [],
                userId: userId
            }).save();
        }

        const existingProductIndex = existingWishList.products.findIndex(item => item.product.toString() === productId);
        if (existingProductIndex !== -1) {
            existingWishList.products.splice(existingProductIndex, 1);
        } else {
            existingWishList.products.push({
                product: productId,
                price: price
            });
        }
        await existingWishList.save();
        res.status(200).json({ success: true, message: 'Product added/removed from wishlist successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


module.exports = { updatewishList, loadWishlist, }