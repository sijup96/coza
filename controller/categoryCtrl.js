const Category = require("../models/categoryModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");

//Load Category page
const loadCategory = asyncHandler(async (req, res) => {
  try {
    res.render("admin/category");
  } catch (error) {
    res.redirect("/admin");
  }
});

//Load updateCategory page
const loadUpdateCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    validateMongoDbId(id);
    const category = await Category.findOne({ _id: id });
    res.render("admin/editCategory", { category });
  } catch (error) {
    res.redirect("/admin");
  }
});
//Create Category

const createCategory = asyncHandler(async (req, res) => {
  try {
    req.body.slug = slugify(req.body.title.toLowerCase());
    req.body.title =
      req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);

    if (await Category.findOne({ slug: req.body.slug })) {
      req.flash("head", `${req.body.title} Category Already Exist`);
      res.redirect("/admin/productCategory");
    } else {
      await Category.create(req.body);
      req.flash("head", `${req.body.title} Category Added Successfully`);
      res.redirect("/admin/productCategory");
    }
  } catch (error) {
    throw new Error(error);
  }
});

//Update Category

const updateCategory = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  const titleSlug = slugify(req.body.title.toLowerCase());

  try {
    validateMongoDbId(_id);
    const checkExist = await Category.findOne({ slug: titleSlug });

    if (checkExist && checkExist._id.toString() !== _id) {
      req.flash("head", "Category already Exist");
      return res.redirect("/admin/updateCategory/" + `${_id}`);
    }
    req.body.title =
      req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
    const updatedCategory = await Category.findByIdAndUpdate(
      _id,
      {
        $set: {
          title: req.body.title,
          slug: titleSlug,
          description: req.body.description,
        },
      },
      { new: true }
    );

    req.flash("head", `${req.body.title} Category Updated Successfully`);
    res.redirect("/admin/productCategory");
  } catch (error) {
    console.error(error);
    req.flash("head", "Error updating category");
    res.redirect("/admin/updateCategory"); // Redirect to an appropriate error page or handle it based on your needs
  }
});
// Update Category Status
const updateCategoryStatus = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    validateMongoDbId(id);
    const updatedCategory = await Category.findByIdAndUpdate(
      { _id: id },
      { $set: { is_listed: req.body.is_listed } },
      { new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.json(error);
  }
});

//Delete category

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    validateMongoDbId(id);
    await Category.findByIdAndDelete(id);
    req.flash("head", "Category deleted Successfully");
    res.redirect("/admin/productCategory");
  } catch (error) {
    throw new Error(error);
  }
});

//Get category

const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    validateMongoDbId(id);
    const getCategory = await Category.findById(id);
    res.json(getCategory);
  } catch (error) {
    throw new Error(error);
  }
});

//Get All category

const getAllCategory = asyncHandler(async (req, res) => {
  try {
    const categoryData = await Category.find().populate('offer')
    const category = Array.isArray(categoryData) ? categoryData : [];
    res.render("admin/category", { category});
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategory,
  loadCategory,
  loadUpdateCategory,
  updateCategoryStatus,
};
