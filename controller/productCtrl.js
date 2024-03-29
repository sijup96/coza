const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const Cart = require("./cartCtrl");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const Wishlist = require("../models/wishListModel");

// Load Product
const loadProduct = asyncHandler(async (req, res) => {
  try {
    const startingPrice = req.query.startingPrice;
    const endPrice = req.query.endPrice;
    const sortByInput = req.query.sortBy || "default";
    let productSearch = "";
    if (req.query.productSearch)
      productSearch = slugify(req.query.productSearch.toLowerCase());
    // Filter
    const filter = {
      is_listed: true,
    };
    if (startingPrice && endPrice) {
      filter.price = { $gte: startingPrice, $lte: endPrice };
    } else if (startingPrice) {
      filter.price = { $gte: startingPrice };
    } else if (endPrice) {
      filter.price = { $lte: endPrice };
    }
    // Search by Slug
    if (productSearch) filter.slug = { $regex: new RegExp(productSearch, "i") };

    // Sort
    let sortBy = {};
    switch (sortByInput) {
      case "popularity":
        sortBy = { sold: -1 };
        break;
      case "lowToHigh":
        sortBy = { price: 1 };
        break;
      case "highToLow":
        sortBy = { price: -1 };
        break;
      case "createdAt":
        sortBy = { updatedAt: -1 };
        break;
      default:
        sortBy = { updatedAt: -1 };
        break;
    }

    const categories = await Category.find({ is_listed: true });
    const categoryIds = categories.map((category) => category._id);
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    let cartData;
    if (accessToken) {
      cartData = await Cart.viewCart(accessToken);
    }
    const wishlistedProducts = await Wishlist.findOne({ userId: userId });

    let products;
    if (categoryIds.length > 0) {
      // Pagination
      const page = req.query.page || 1; // Default to page 1 if not provided
      const limit = 8; // Number of items per page
      const skip = (page - 1) * limit;

      products = await Product.find({
        category: { $in: categoryIds },
        ...filter,
      })
        .sort(sortBy)
        .skip(skip)
        .limit(limit);

      const totalProductsCount = await Product.countDocuments({
        category: { $in: categoryIds },
        ...filter,
      });

      const totalPages = Math.ceil(totalProductsCount / limit);

      // Check if any filtering parameters are provided
      if (
        !startingPrice &&
        !endPrice &&
        sortByInput === "default" &&
        !productSearch
      ) {
        return res.render("product", {
          products,
          categories,
          cartData,
          wishlistedProducts,
          currentPage: parseInt(page),
          totalPages,
          sortBy: sortByInput, // Pass sortBy to the template for active state
        });
      } else {
        return res.status(200).json({
          success: true,
          products,
          categories,
          cartData,
          wishlistedProducts,
          currentPage: parseInt(page),
          totalPages,
          sortBy: sortByInput, // Pass sortBy to the response for client-side sorting
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

const loadProductDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    const cartData = await Cart.viewCart(accessToken);
    const productData = await Product.findById({ _id: id })
      .populate("offer")
      .populate("category");
    const product = await productData.populate("category.offer");
    const isWishlisted = await Wishlist.findOne({
      userId: userId,
      "products.product": product._id,
    });
    if (product.is_listed == true) {
      res.render("product-detail", { product, cartData, isWishlisted });
    } else {
      res.send(` <script>
             alert('Sorry..., this product was unListed by Admin');
             window.history.back();
          </script>`);
      res.render("product-detail", { product, cartData, isWishlisted });
    }
  } catch (error) {
    // Handle the error or log it
    console.error(error);
    // Optionally, you can render an error page or send an error response
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

// Load addProduct
const loadaddProduct = asyncHandler(async (req, res) => {
  try {
    const categoryData = await Category.find();
    const category = Array.isArray(categoryData) ? categoryData : [];
    res.render("admin/addProduct", { category });
  } catch (error) {
    res.render("errorPage");
  }
});

// Load Update Product
const loadUpdateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.find({ is_listed: true });
    const updateProduct = await Product.findById({ _id: id });
    const catId = updateProduct.category;
    const selectedCategory = await Category.findById({ _id: catId });
    res.render("admin/editProduct", {
      product: updateProduct,
      category: category,
      categoryData: selectedCategory,
    });
  } catch (error) {
    res.render("errorPage");
  }
});

// Admin Load All Products
const loadAllProducts = asyncHandler(async (req, res) => {
  try {
    const productData = await Product.find({})
      .sort({ updatedAt: -1 })
      .populate("offer");
    const products = Array.isArray(productData) ? productData : [];
    res.render("admin/products", { products });
  } catch (error) {
    console.error("Error loading all products:", error);
    res.render("errorPage");
  }
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    req.body.slug = slugify(req.body.title.toLowerCase());
    const [existSlug, existSize] = await Promise.all([
      Product.findOne({ slug: req.body.slug }),
      Product.findOne({ size: req.body.size }),
    ]);
    if (existSlug && existSize) {
      req.flash("title", "Product already exists");

      res.redirect("/admin/addProduct");
    }
    const files = req.files;
    const resizedImages = [];
    if (!files || !Array.isArray(files)) {
      req.flash("head", "No files or invalid files array in the request.");
      res.redirect("/admin/addProduct");
    }
    for (let i = 0; i < 4; i++) {
      const originalPath = req.files[i].path;
      const resizedPath = path.join(
        __dirname,
        "../public/resize",
        req.files[i].filename
      );
      await sharp(originalPath)
        .resize(1100, 1210, { fit: "fill" })
        .toFile(resizedPath);
      console.log("Resized path:", resizedPath);
      resizedImages[i] = req.files[i].filename;
    }
    const {
      title,
      description,
      quantity,
      price,
      category,
      brand,
      size,
      color,
      sex,
    } = req.body;
    const cat = await Category.findById(category);
    console.log(category, cat);
    // const images = req.files.map((file) => file.originalname);
    const newProduct = new Product({
      title,
      description,
      quantity,
      price,
      images: resizedImages,
      category,
      brand,
      sex,
      slug: req.body.slug,
      size,
      color,
    });
    await newProduct.save();
    // Return a success response (adjust as needed for your application)
    req.flash("head", "Product created successfully");

    res.redirect("/admin/addProduct");
  } catch (error) {
    throw new Error(error);
    // res.render("errorPage");
  }
});

//Update Product

const updateProduct = asyncHandler(async (req, res) => {
  const {
    id,
    title,
    description,
    quantity,
    price,
    sex,
    category,
    brand,
    size,
    is_listed,
  } = req.body;
  try {
    req.body.slug = slugify(req.body.title.toLowerCase());
    const existingProduct = await Product.findById(id);

    if (
      existingProduct.slug === req.body.slug &&
      existingProduct.size === size &&
      existingProduct.is_listed === is_listed
    ) {
      req.flash("head", "Product already exists");

      return res.redirect("/admin/updateProduct/" + id);
    }
    const images = req.files.map((file) => file.originalname);
    const updateFields = {
      $set: {
        title,
        slug: req.body.slug,
        description,
        price,
        sex,
        category,
        quantity,
        brand,
        size,
        is_listed,
      },
    };

    if (images) {
      if (Array.isArray(images)) {
        // If images is an array, use $push with $each
        updateFields.$push = { images: { $each: images } };
      } else {
        // If images is a string, use $push without $each
        updateFields.$push = { images };
      }
    }

    const updateProduct = await Product.findOneAndUpdate(
      { _id: id },
      updateFields,
      { new: true }
    );
    req.flash("head", ` ${updateProduct.title} Updated successfully`);
    res.redirect("/admin/products");
  } catch (error) {
    throw new Error(error);
  }
});
//Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const deleteProduct = await Product.findByIdAndDelete({ _id: id });
    res.redirect(302, "/admin/products");
  } catch (error) {
    res.render("errorPage");
  }
});
const deleteImage = asyncHandler(async (req, res) => {
  try {
    const { selectedImages } = req.body;

    // Find products containing the selected images
    const products = await Product.find({ images: { $in: selectedImages } });

    // Remove selected images from each product in the database
    for (const product of products) {
      product.images = product.images.filter(
        (image) => !selectedImages.includes(image)
      );
      await product.save();
    }

    // Delete the corresponding image files from the server
    selectedImages.forEach(async (imageName) => {
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "productImages",
        imageName
      );

      try {
        // Delete the image file
        await fs.promises.unlink(imagePath);
      } catch (error) {
        console.error("Error deleting image file:", error);
        // Handle the error (send a response or log it)
      }
    });

    res.status(200).json({ message: "Images deleted successfully" });
  } catch (error) {
    console.error("Error deleting images:", error);
    res.status(500).json({ error: "Failed to delete images" });
  }
});

//get a product

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  } catch (error) {
    res.render("errorPage");
  }
});

//get all product

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    //Filtering

    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Product.find(JSON.parse(queryStr));

    //sorting

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //Limiting the Fields

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    //Pagination

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("page does not exist");
    }

    const product = await query;
    res.json(product);
  } catch (error) {
    res.render("errorPage");
  }
});

// Add to Wishlist

const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById({ _id });
    const alreadyAdded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyAdded) {
      let user = await User.findByIdAndUpdate(
        { _id },
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        { _id },
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } catch (error) {
    res.render("errorPage");
  }
});

module.exports = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  loadProduct,
  loadaddProduct,
  loadAllProducts,
  loadUpdateProduct,
  deleteImage,
  loadProductDetail,
};
