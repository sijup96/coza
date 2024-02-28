const express = require('express');
const { loadOffers, createOffer, deleteOffer, changeOfferStatus } = require('../controller/offerCtrl');
const { userMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', isAdmin, loadOffers);
router.post('/create', isAdmin, createOffer);
router.delete('/delete', isAdmin, deleteOffer);
router.patch('/updateStatus', isAdmin, changeOfferStatus);



module.exports = router;