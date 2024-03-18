const Offer = require("../models/offerModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// Load Offer Page
const loadOffers = asyncHandler(async (req, res) => {
  try {
    const offerDetail = await Offer.find({}).sort({ updatedAt: -1 });

    res.render("admin/offer", { offerDetail });
  } catch (error) {
    throw new Error(error);
  }
});
// Create Offer
const createOffer = asyncHandler(async (req, res) => {
  try {
    const { offerName, percentage, description, startingDate, expiryDate } =
      req.body;
    if (startingDate > expiryDate) {
      return res.status(400).json({
        message:
          "Starting date must be less than expiry date and starting date should be after current date.",
      });
    }
    if (!(percentage >= 1 && percentage <= 99)) {
      return res
        .status(400)
        .json({ message: "Make Percentage between 1 to 100" });
    }
    const slug = slugify(req.body.offerName.toLowerCase());
    const offerExist = await Offer.findOne({ slug: slug });
    if (!offerExist) {
      const newOffer = await Offer.create({
        offerName,
        slug,
        percentage,
        description,
        startingDate,
        expiryDate,
      });
      res
        .status(200)
        .json({ success: true, message: "Offer created successfully." });
    } else {
      res.status(400).json({ message: "Offer name already exist." });
    }
  } catch (error) {
    res.status(500);
  }
});
// Delete Offer
const deleteOffer = asyncHandler(async (req, res) => {
  try {
    const { offerId } = req.body;
    const deleted = await Offer.findByIdAndDelete(offerId);
    if (deleted) {
      res
        .status(200)
        .json({ success: true, message: "Offer deleted Successfully" });
    } else {
      res.status(404).json({ success: false, message: "Offer not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// List or Unlist Offer
const changeOfferStatus = asyncHandler(async (req, res) => {
  try {
    const { offerId, is_listed } = req.body;
    const updatedStatus = await Offer.findByIdAndUpdate(
      { _id: offerId },
      { $set: { is_listed: is_listed } },
      { new: true }
    );
    if (updatedStatus) {
      res.json({ success: true });
    }
  } catch (error) {}
});
//Get a Offer
const getOffer = asyncHandler(async (req, res) => {
  try {
    const offerId = req.params.id;
    const offerData = await Offer.findById(offerId);
    if (!offerData) {
      return res.status(404).json({ message: "Offer not found" });
    }
    res.status(200).json({ offerData: offerData });
  } catch (error) {
    res.status(500);
  }
});
//Edit Offer
const editOffer = asyncHandler(async (req, res) => {
  try {
    const {
      offerId,
      offerName,
      percentage,
      description,
      startingDate,
      expiryDate,
    } = req.body;
    const slug = slugify(req.body.offerName.toLowerCase());
    const existingOffer = await Offer.findOne({ slug: slug });
    if (existingOffer && existingOffer._id.toString() !== offerId) {
      return res.status(400).json({ message: "Offer already exist" });
    }
    if (startingDate > expiryDate) {
      return res
        .status(400)
        .json({ message: "Starting date must be less than expiry date ." });
    }

    if (!(percentage >= 1 && percentage <= 99)) {
      return res
        .status(400)
        .json({ message: "Make Percentage between 1 to 100" });
    }
    const updateOffer = await Offer.findByIdAndUpdate(
      { _id: offerId },
      {
        $set: {
          offerName,
          percentage,
          description,
          startingDate,
          expiryDate,
        },
      },
      { new: true }
    );
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    throw new Error(error);
  }
});
// Get all offers
const getAllOffers = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();

    const offers = await Offer.find({
      expiryDate: { $gte: currentDate },
      is_listed: true,
    });
    if (offers) {
      res.status(200).json({ offerData: offers });
    } else {
      res.status(400).json({ message: "Offer not found." });
    }
  } catch (error) {
    res.status(500).json({ message: "Invalid server Error." });
  }
});
// Offer Apply to Product
const applyToProduct = asyncHandler(async (req, res) => {
  try {
    const { offerId, productId } = req.body;
    const offerApplied = await Product.findByIdAndUpdate(
      { _id: productId },
      {
        $set: {
          offer: offerId,
        },
      },
      { new: true }
    );
    if (offerApplied) {
      res.status(200).json({ message: "Offer applied Successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500);
  }
});
//Remove Product Offer
const removeProductOffer = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;
    await Product.findByIdAndUpdate(
      { _id: productId },
      {
        $unset: { offer: 1 },
      },
      { new: true }
    );
    res.status(200).json({ message: "Offer deleted Successfully" });
  } catch (error) {
    throw new Error(error);
  }
});
// Offer Apply to Category
const applyToCategory = asyncHandler(async (req, res) => {
  try {
    const { offerId, categoryId } = req.body;
    const offerApplied = await Category.findByIdAndUpdate(
      { _id: categoryId },
      {
        $set: {
          offer: offerId,
        },
      },
      { new: true }
    );
    if (offerApplied) {
      res.status(200).json({ message: "Offer applied Successfully" });
    } else {
      res.status(404).jspn({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500);
  }
});
//Remove Product Offer
const removeCategoryOffer = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.body;
    await Category.findByIdAndUpdate(
      { _id: categoryId },
      {
        $unset: { offer: 1 },
      },
      { new: true }
    );
    res.status(200).json({ message: "Offer deleted Successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  loadOffers,
  createOffer,
  deleteOffer,
  changeOfferStatus,
  getOffer,
  editOffer,
  getAllOffers,
  applyToProduct,
  removeProductOffer,
  applyToCategory,
  removeCategoryOffer,
};
