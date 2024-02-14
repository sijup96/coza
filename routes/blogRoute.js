const express = require('express');
const { userMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, loadBlog } = require('../controller/blogCtrl');
const router = express.Router();


router.get("/", loadBlog);
router.post("/adminBlog", userMiddleware, isAdmin, createBlog);
router.put("/updateBlog/:id", userMiddleware, isAdmin, updateBlog);
router.get("/getBlog/:id", getBlog);
router.get("/getAllBlog", getAllBlogs);
router.delete("/deleteBlog/:id", userMiddleware, isAdmin, deleteBlog);


module.exports = router;