const User = require('../models/userModel');
const asyncHandler = require("express-async-handler")



//Load Address Page
const loadUserAddress = asyncHandler(async (req, res) => {
    const id=req.user._id
   const user= await User.findById({_id:id});
     res.render('userAddresses',{user});
   });

   //Create Address
   const createUser = asyncHandler(async (req, res) => {
    try {
      const { name, mobile, houseName, street, landmark,pincode,city  } = req.body;
      // Check if the user already exists
      const findUser = await User.findOne({ email: email.trim() });
      if (!findUser) {
        // Create new user
        const newUser = await User.create({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          password: password
        });
        sendOTP({ email: newUser.email });
        res.render('otp', { email })
      } else {
        req.flash('head', `This Email is Already Regestered Please Login... `);
        // User already exists
        res.redirect('/login');
      }
    } catch (error) {
      // Handle unexpected errors
      console.error(error);
      req.flash('invalid', 'Invalid credentials');
      res.redirect('/register');
    }
  });


   module.exports={
    loadUserAddress,
   }