const express = require('express');
const { createCategory, updateCategory, deleteCategory, getCategory, getAllCategory } = require('../controller/categoryCtrl');
const { userMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/createCategory', userMiddleware, isAdmin, createCategory);
router.put('/updateCategory/:id', userMiddleware, isAdmin, updateCategory);
router.delete('/deleteCategory/:id', userMiddleware, isAdmin, deleteCategory);
router.get('/getCategory/:id', getCategory);
router.get('/getAllCategory', getAllCategory);



module.exports = router;