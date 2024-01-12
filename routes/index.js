const express = require('express');
const router = express.Router();
const {loadAbout,loadContact}=require('../controller/aboutCtrl')

router.get('/',loadAbout);
router.get('/details',loadContact);



module.exports = router;
