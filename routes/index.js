const express = require('express');
const router = express.Router();
const {loadAbout,loadContact}=require('../controller/aboutCtrl')
const { userHome }=require('../controller/userCtrl')
const { authMiddleware, isAdmin, cacheControl } = require('../middlewares/authMiddleware');


router.get('/about',loadAbout);
router.get('/details',loadContact);



module.exports = router;
