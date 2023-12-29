const Category=require('../models/prodCategoryModel');
const asyncHandler=require('express-async-handler');
const validateMongoDbId=require('../utils/validateMongodbId');

//Create Category

const createCategory=asyncHandler(async(req,res)=>{
try {
    const newCategory=await Category.create(req.body)
    res.json(newCategory)
} catch (error) {
    throw new Error(error)
}
});

//Update Category

const updateCategory=asyncHandler(async(req,res)=>{
    const {id}=req.params
    
try {
    validateMongoDbId(id)
    const updatedCategory=await Category.findByIdAndUpdate(id,req.body,
    {
new:true,
    })
    res.json(updatedCategory)
} catch (error) {
    throw new Error(error)
}
});



module.exports={createCategory,updateCategory}