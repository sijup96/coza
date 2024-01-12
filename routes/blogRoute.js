const express=require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, loadBlog } = require('../controller/blogCtrl');
const router=express.Router();


router.get("/",loadBlog);
router.post("/adminBlog",authMiddleware,isAdmin,createBlog);
router.put("/updateBlog/:id",authMiddleware,isAdmin,updateBlog);
router.get("/getBlog/:id",getBlog);
router.get("/getAllBlog",getAllBlogs);
router.delete("/deleteBlog/:id",authMiddleware,isAdmin,deleteBlog);


module.exports=router;