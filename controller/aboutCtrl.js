// const asyncHandler = require("express-async-handler");
// const jwt = require("jsonwebtoken");
// const cart = require("./cartCtrl");

// const loadAbout = asyncHandler(async (req, res) => {
//   try {
//     const accessToken = req.accessToken;
//     const cartData = await cart.viewCart(accessToken);
//     res.render("about", { cartData });
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const loadContact = asyncHandler(async (req, res) => {
//   try {
//     res.redirect("/contact");
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// module.exports = { loadAbout, loadContact };
