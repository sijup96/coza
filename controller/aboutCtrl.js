const asyncHandler=require('express-async-handler');

const loadAbout=asyncHandler(async(req,res)=>{
    try {
        res.render('about')
    } catch (error) {
        throw new Error(error)
    }
    });


    const loadContact=asyncHandler(async(req,res)=>{
        try {
            res.redirect('/contact')
        } catch (error) {
            throw new Error(error)
        }
        });


    module.exports={loadAbout,loadContact}