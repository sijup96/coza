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
        console.log(cartData);
        const userAddress = await Address.find({ user: userId, default: true }).populate('user')
        res.render('cartPage', { cartData, userAddress })
    } catch (error) {
        throw new Error(error)
    }

});

//Create Cart Item
const addToCart = asyncHandler(async (req, res) => {
    try {
        const productId = req.body.productId;
        const quantity = parseInt(req.body.quantity, 10);
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        // Find Product
        const selectedProduct = await Product.findById({_id:productId});
        if (!selectedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const price = selectedProduct.price * quantity;

        // Check Cart Existence
        let existingCart = await Cart.findOne({ userId });
        if (!existingCart) {
            existingCart = await new Cart({
                products: [],
                cartTotal: 0,
                userId: userId,
            }).save();
        }

        // Check if the product already exists in the cart
        const existingProduct = existingCart.products.find(product => product.product.equals(productId));
        if (existingProduct) {
            // Check if adding quantity exceeds available stock
            if ((existingProduct.quantity + quantity) > selectedProduct.quantity) {
                return res.status(400).json({ error: 'Exceeds available stock' });
            }

            // Update existing product quantity and cart total
            existingProduct.quantity += quantity;
            existingCart.cartTotal += price;
            await existingCart.save();

            return res.status(200).json({ success: 'Product already exists, increased the quantity' });
        } else {
            // Add product to cart
            existingCart.products.push({
                product: productId,
                quantity: quantity,
                price:price,
            });
            existingCart.cartTotal += price;
            await existingCart.save();

            return res.json({ message: 'Product added to the cart', cart: existingCart });
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Update Cart
const updateCart=asyncHandler(async (req,res)=>{
    try {
        
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });

    }
})
//Delete Product From Cart
const deleteCartProduct = asyncHandler(async (req, res) => {
    try {
        const productId = req.body.productId;
        const accessToken = req.accessToken;
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const existingCart = await Cart.findOne({ userId });
        if (existingCart) {
            // Remove the product from the cart
            existingCart.products = existingCart.products.filter(product => !product.product.equals(productId));
            await existingCart.save();
            return res.json({ success: true });
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
    try {
        const accessToken = req.accessToken
        const cartData = await viewCart(accessToken);
        const quantity = req.body.quantity;
        const productId = req.body.productId;
        let alreadyAddedQuantity = 0
        for (i = 0; i < cartData.products.length; i++) {
            if (cartData.products[i].product._id == productId) {
                alreadyAddedQuantity = cartData.products[i].quantity
            }
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity <= product.quantity - alreadyAddedQuantity) {
            return res.status(200).json({ message: 'Quantity is within available limits' });
        } else {
            return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = {
    loadCart,
    addToCart,
    viewCart,
    deleteCartProduct,
    checkQuantity,
}