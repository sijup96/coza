const Offer = require('../models/offerModel')
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');
const slugify = require('slugify');

// Load Offer Page
const loadOffers = asyncHandler(async (req, res) => {
    try {
        const offerDetail = await Offer.find({}).sort({ updatedAt: -1 })

        res.render('admin/offer', { offerDetail })

    } catch (error) {
        throw new Error(error)
    }
});
// Create Offer
const createOffer = asyncHandler(async (req, res) => {
    try {
        const { offerName, percentage, description, startingDate, expiryDate } = req.body;
        const slug = slugify(req.body.offerName.toLowerCase());
        const offerExist = await Offer.findOne({ slug: slug });
        if (!offerExist) {
            const newOffer = await Offer.create({
                offerName,
                slug,
                percentage,
                description,
                startingDate,
                expiryDate
            });
            console.log(newOffer);
            res.status(200).json({ success: true, message: 'Offer created successfully.' });
        } else {
            console.log('ofer');
        }

    } catch (error) {
        throw new Error(error)
    }
});
// Delete Offer
const deleteOffer = asyncHandler(async (req, res) => {
    try {
        const { offerId } = req.body
        const deleted = await Offer.findByIdAndDelete(offerId)
        if (deleted) {
            res.status(200).json({ success: true, message: 'Offer deleted Successfully' })
        } else {
            res.status(404).json({ success: false, message: 'Offer not found' })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// List or Unlist Offer
const changeOfferStatus = asyncHandler(async (req, res) => {
    try {
        const { offerId, is_listed } = req.body;
        const updatedStatus = await Offer.findByIdAndUpdate(
            { _id: offerId },
            { $set: { is_listed: is_listed } },
            { new: true })
        if (updatedStatus) {
            res.json({ success: true })
        }
    } catch (error) {

    }
})




module.exports = { loadOffers, createOffer, deleteOffer, changeOfferStatus, }