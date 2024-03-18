const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");
const jwt = require("jsonwebtoken");
const Wallet = require("../models/walletModel");
const Coupon = require("../models/couponModel");

// Load Cart Page
const loadCart = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const cartData = await viewCart(accessToken);
    const userAddress = await Address.find({
      user: userId,
      default: true,
    }).populate("user");
    if (cartData && cartData.products) {
      for (const cartProduct of cartData.products) {
        if (!cartProduct.product.is_listed) {
          cartProduct.price = 0;
          await cartData.save();
        }
      }
      res.render("cartPage", { cartData, userAddress });
    } else {
      res.render("cartPage", { cartData, userAddress });
    }
  } catch (error) {
    throw new Error(error);
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
    const selectedProducts = await Product.findById({
      _id: productId,
    })
      .populate("offer")
      .populate("category");
    const selectedProduct = await selectedProducts.populate("category.offer");
    if (
      !selectedProduct ||
      selectedProduct.is_listed === false ||
      Product.quantity == 0
    ) {
      return res.status(404).json({ error: "Product not found" });
    }
    let offer = 0;
    if (selectedProduct.offer || selectedProduct.category.offer) {
      offer = selectedProduct.offer
        ? selectedProduct.offer.percentage
        : selectedProduct.category.offer.percentage;
    }
    if (offer > 0) {
      offer = Math.round((offer * selectedProduct.price) / 100);
    }
    const discountedPrice = selectedProduct.price - offer;
    const price = discountedPrice * quantity;
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
    const existingProduct = existingCart.products.find((product) =>
      product.product.equals(productId)
    );
    if (existingProduct) {
      // Check if adding quantity exceeds available stock
      if (existingProduct.quantity + quantity > selectedProduct.quantity) {
        return res.status(400).json({ error: "Exceeds available stock" });
      }
      if (selectedProduct.quantity == 0) {
        return res.status(400).json({ error: "Out of stock" });
      }

      // Update existing product quantity and cart total
      existingProduct.quantity += quantity;
      existingCart.cartTotal += price;
      await existingCart.save();

      return res
        .status(200)
        .json({ success: "Product already exists, increased the quantity" });
    } else {
      // Add product to cart
      existingCart.products.push({
        product: productId,
        quantity: quantity,
        price: price,
      });

      existingCart.cartTotal += price;
      await existingCart.save();

      return res.json({
        message: "Product added to the cart",
        cart: existingCart,
      });
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update Cart
const updateCart = asyncHandler(async (req, res) => {
  try {
    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity, 10);

    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = decodedToken.id;
    const productDetail = await Product.findById(productId)
      .populate("category")
      .populate("offer");
    const productDetails = await productDetail.populate("category.offer");
    const existingCart = await Cart.findOne({ userId });
    const existingProduct = existingCart.products.find((product) =>
      product.product.equals(productId)
    );
    if (existingCart && existingProduct && productDetails.is_listed === true) {
      // Check if requested quantity is within available limits
      if (quantity <= productDetails.quantity) {
        const diffQuantity = quantity - existingProduct.quantity;
        let offer = 0;
        if (productDetails.offer || productDetails.category.offer) {
          offer = productDetails.offer
            ? productDetails.offer.percentage
            : productDetails.category.offer.percentage;
        }
        if (offer > 0) {
          offer = Math.round((offer * productDetails.price) / 100);
        }
        const priceAfterDiscount = productDetails.price - offer;
        existingProduct.quantity = quantity;
        existingCart.cartTotal += diffQuantity * priceAfterDiscount;
        await existingCart.save();

        return res
          .status(200)
          .json({ message: "Quantity updated successfully" });
      } else {
        return res
          .status(400)
          .json({ message: "Requested quantity exceeds available quantity" });
      }
    } else {
      return res.status(404).json({ message: "Product not found in the cart" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//Delete Product From Cart
const deleteCartProduct = asyncHandler(async (req, res) => {
  try {
    const productId = req.body.productId;
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const existingCart = await Cart.findOne({ userId });

    if (existingCart) {
      // Find the product to be deleted
      const deletedProduct = existingCart.products.find((product) =>
        product.product.equals(productId)
      );

      if (deletedProduct) {
        // Remove the product from the cart
        existingCart.products = existingCart.products.filter(
          (product) => !product.product.equals(productId)
        );
        existingCart.cartTotal -=
          deletedProduct.quantity * deletedProduct.price;

        await existingCart.save();
        return res.json({ success: true });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found in the cart" });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// View Cart
const viewCart = async (accessToken) => {
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Find the cart data for the user, populating nested fields
    const cartData = await Cart.findOne({ userId })
      .populate({
        path: "products.product",
        populate: [
          { path: "offer" },
          { path: "category", populate: { path: "offer" } },
        ],
      })
      .populate("userId");
    return cartData;
  } catch (error) {
    throw new Error(error);
  }
};

//Check Quantity
const checkQuantity = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const cartData = await viewCart(accessToken);
    const quantity = req.body.quantity;
    const productId = req.body.productId;
    let alreadyAddedQuantity = 0;
    for (i = 0; i < cartData.products.length; i++) {
      if (cartData.products[i].product._id == productId) {
        alreadyAddedQuantity = cartData.products[i].quantity;
      }
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity <= product.quantity - alreadyAddedQuantity) {
      return res
        .status(200)
        .json({ message: "Quantity is within available limits" });
    } else {
      return res
        .status(400)
        .json({ message: "Requested quantity exceeds available quantity" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
// Load Checkout
const loadCheckout = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const cartData = await viewCart(accessToken);
    const userAddress = await Address.find({ user: userId }).populate("user");
    const walletData = await Wallet.findOne({ user: userId });
    const currentDate = new Date();
    const couponData = await Coupon.find({
      expiryDate: { $gte: currentDate },
      is_listed: true,
      usersUsed: { $ne: userId } ,
    });
    if (cartData.products.length === 0) {
      return res.redirect("/cart");
    }
    const isValid = cartData.products.every((item) => {
      return (
        item.quantity > 0 &&
        item.quantity <= item.product.quantity &&
        item.product.is_listed === true
      );
    });
    if (!isValid) {
      req.flash("head", " Product is unListed or Out of stock");
      return res.redirect("/cart");
    }
    res.render("checkout", { cartData, userAddress, walletData, couponData });
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

module.exports = {
  loadCart,
  addToCart,
  viewCart,
  deleteCartProduct,
  checkQuantity,
  updateCart,
  loadCheckout,
};
