const express = require("express");
const {
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
} = require("../controller/offerCtrl");
const { isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.put("/removeCategoryOffer", isAdmin, removeCategoryOffer);
router.put("/applyToCategory", isAdmin, applyToCategory);

router.put("/removeProductOffer", isAdmin, removeProductOffer);
router.put("/applyToProduct", isAdmin, applyToProduct);

router.post("/create", isAdmin, createOffer);
router.delete("/delete", isAdmin, deleteOffer);

router.patch("/updateStatus", isAdmin, changeOfferStatus);
router.put("/edit", isAdmin, editOffer);

router.get("/getOffer/:id", isAdmin, getOffer);
router.get("/getAllOffers", isAdmin, getAllOffers);
router.get("/", isAdmin, loadOffers);

module.exports = router;
