const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const jwt = require("jsonwebtoken");
const cart = require("./cartCtrl");
const Category = require("../models/categoryModel");

//Load Blog

const loadBlog = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const cartData = await cart.viewCart(accessToken);
    const categories = await Category.find({ is_listed: true });
    console.log(cartData);
    res.render("blog", { cartData, categories });
  } catch (error) {
    throw new Error(error);
  }
});

//Create Blog

const createBlog = asyncHandler(async (req, res) => {
  try {
    const newBlog = await Blog.create(req.body);
    res.json(newBlog);
  } catch (error) {
    throw new Error(error);
  }
});

//Update Blog

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateBlog);
  } catch (error) {
    throw new Error(error);
  }
});

//Get a Blog

const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getBlog = await Blog.findById({ _id: id });
    const updateViews = await Blog.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      { new: true }
    );
    res.json(getBlog);
  } catch (error) {
    throw new Error(error);
  }
});

//Get all Blogs

const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const getAllBlogs = await Blog.find();
    res.json(getAllBlogs);
  } catch (error) {
    throw new Error(error);
  }
});

//Delete a Blog

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deleteBlog = await Blog.findByIdAndDelete(id);
    res.json(deleteBlog);
  } catch (error) {
    throw new Error(error);
  }
});

// Likes and Dislikes (4.52)

module.exports = {
  createBlog,
  updateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog,
  loadBlog,
};
