const Product = require('../models/productModel')
const Category = require('../models/prodCategoryModel');
const asyncHandler = require('express-async-handler')
const slugify = require('slugify')
const User = require('../models/userModel');
const fs = require('fs');
const path = require('path');
const { error } = require('console');


// Load Product
const loadProduct = asyncHandler(async (req, res) => {
    try {
        res.render('admin/products')
    } catch (error) {
        res.render("errorPage");    }
});

// Load addProduct
const loadaddProduct = asyncHandler(async (req, res) => {
    try {
        const categoryData = await Category.find()
        const category = Array.isArray(categoryData) ? categoryData : [];
        res.render('admin/addProduct', { category })
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
    const selectedCategory= await Category.findOne({_id: updateProduct.category})
    res.render("admin/editProduct", {
      product: updateProduct,
      category: category,
      categoryData:selectedCategory
    });
  } catch (error) {
    res.render("errorPage");
  }
});

// Load All Products
const loadAllProducts = async (req, res) => {
    try {
        const productData = await Product.find({});
        const products = Array.isArray(productData) ? productData : [];

        console.log(productData);
        res.render('admin/products', { products });
    } catch (error) {
        res.render("errorPage");
    }
};


const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        const [existSlug, existSize, existColor] = await Promise.all([
            Product.findOne({ slug: req.body.slug }),
            Product.findOne({ size: req.body.size }),
            Product.findOne({ color: req.body.color }),
        ]);

        if (existSlug && existSize && existColor) {
            req.flash('title', 'Product already exists');

            res.redirect('/admin/addProduct');

        }
        const files = req.files; // Check if req.files is defined

        console.log(files);
        console.log(req.body);
        if (!files || !Array.isArray(files)) {
            req.flash('image', 'No files or invalid files array in the request.');

            res.redirect('/admin/addProduct');
        }

        const { title, description, quantity, price, category, brand, size, color } = req.body;
        const images = req.files.map((file) => file.originalname);
        const selectedCategory = await Category.findOne({ title: category });
        // const filenames = [];

        // // Resize and save each uploaded image
        // for (let i = 0; i < files.length; i++) {
        //     const imagesPath = path.join(__dirname, '../public/sharpimages', files[i].filename);
        //     await sharp(files[i].path).resize(800, 1200, { fit: 'fill' }).toFile(imagesPath);
        //     filenames.push(files[i].filename);
        // }

        const newProduct = new Product({
            title,
            description,
            quantity,
            price,
            images,
            category: selectedCategory._id,
            brand,
            slug: req.body.slug,
            size,
            color
        });
        await newProduct.save();
        console.log(newProduct);

        // Return a success response (adjust as needed for your application)
        req.flash('head', 'Product created successfully');

        res.redirect('/admin/addProduct');
    } catch (error) {
        res.render("errorPage");
    }
});

//Update Product

const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params.id
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        const updateProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
            new: true,
        })
        res.json(updateProduct)
    } catch (error) {
        res.render("errorPage");
    }
});

//Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params.id
    try {
        console.log(id);
        const deleteProduct = await Product.findOneAndDelete({ _id: id })
        console.log(deleteProduct);
        const filePath = path.join(__dirname, 'public', 'myImages', deleteProduct.images)
        fs.unlink(filePath,(error)=>{
            if (error) {
                console.error(`Error deleting file ${filePath}: ${error}`);
                return;
            }
            console.log(`File ${filePath} deleted successfully`);
        })
        res.redirect(302, '/admin/products');
    } catch (error) {
        res.render("errorPage");
    }

});
//get a product

const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    try {
        const findProduct = await Product.findById(id)
        res.json(findProduct)
    } catch (error) {
        res.render("errorPage");
    }
});

//get all product

const getAllProduct = asyncHandler(async (req, res) => {
    try {

        //Filtering

        const queryObj = { ...req.query }
        const excludeFields = ["page", "sort", "limit", "fields"]
        excludeFields.forEach((el) => delete queryObj[el])

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
        let query = Product.find(JSON.parse(queryStr))

        //sorting

        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ')
            query = query.sort(sortBy)
        } else {
            query = query.sort('-createdAt')
        };

        //Limiting the Fields

        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ')
            query = query.select(fields)
        } else {
            query = query.select('-__v')
        };

        //Pagination

        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount) throw new Error('page does not exist')
        };

        const product = await query
        res.json(product)
    } catch (error) {
        res.render("errorPage");
    }

});

// Add to Wishlist

const addToWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
        const user = await User.findById({ _id })
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
            res.json(user)
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
            res.json(user)
        }
    } catch (error) {
        res.render("errorPage");
    }
})

module.exports = {
    createProduct, getProduct, getAllProduct,
    updateProduct, deleteProduct, addToWishlist, loadProduct,
    loadaddProduct, loadAllProducts, loadUpdateProduct
}