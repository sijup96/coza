const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel');
const asyncHandler = require("express-async-handler")
const validateMongoDbId = require('../utils/validateMongodbId')
const { generateRefreshToken } = require('../config/refreshToken');
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const sendEmail = require('./emailCtrl')
const crypto = require('crypto');
const mailOTP = require('../models/mailOTP')
const bcrypt = require('bcrypt');
const Category = require('../models/prodCategoryModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')

/* GET home page. */
const userHome = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ is_listed: true });
    const categoryIds = categories.map(category => category._id);

    if (categoryIds.length > 0) {
      const productsFemale = await Product.find({ category: { $in: categoryIds }, is_listed: true, sex: 'female' });
      const productsMale = await Product.find({ category: { $in: categoryIds }, is_listed: true, sex: 'male' });
      const productsUnisex = await Product.find({ category: { $in: categoryIds }, is_listed: true, sex: 'unisex' });
      res.render('index', { productsFemale, productsMale, productsUnisex, categories });
    } else {
      // Handle the case when no categories are found
      console.log('No categories found');
      res.render('index',);
    }
  } catch (error) {
    // Handle the error appropriately, e.g., log it or send an error response
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//Get Login page

const userLogin = asyncHandler(async (req, res) => {
  try {
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache');

    // Extract cookies from the request
    const cookies = req.cookies;

    // Check if there is a refreshToken cookie
    if (!cookies || !cookies.refreshToken) {
      // Render 'userLogin' if refreshToken cookie is not present

      res.render('userLogin');
    } else {
      // Render 'index' if refreshToken cookie is present
      res.redirect('/');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);

    // Redirect to an error page or take appropriate action
    res.status(500).send('Internal Server Error');
  }
});


//Register page
const userRegister = asyncHandler(async (req, res) => {
  res.redirect('/login');
});

//Load  User Profile Page
const userAccount = asyncHandler(async (req, res) => {
  const accessToken = req.accessToken;
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const userData = await Address.findOne({ user: userId,default:true }).populate('user')
    if (!userData) {
      return res.status(404).send('User not found');
    }
    res.render('userAccount', { userData });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).send('Invalid token');
    }

  }
});



//Reset Password page
const loadCreatePassword = asyncHandler(async (req, res) => {
  const token = req.params.id;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  res.render('resetPassword');
});

//Reset Password page
const loadVerifyEmailPage = asyncHandler(async (req, res) => {
  res.render('verifyEmail');
});

//Validate form
const validateUser = asyncHandler(async (req, res) => {
  try {
    const { firstname, password, email, mobile } = req.body;
    console.log(req.body);
    let response = {};

    // Name Validation

    if (firstname && (firstname.trim() === "" || firstname.trim().length < 3)) {
      response.fnameStatus = "Name must contain 3 or more letters";
    } else if (!/^[^\s\d!@#$%^&*(),.?":{}|<>_+=\[\\;\]`~]*[a-zA-ZÀ-ÖØ-öø-ÿ-' ]+[^\s!@#$%^&*(),.?":{}|<>_+=\[\\;\]`~]*$/.test(firstname)) {
      response.fnameStatus = "Please enter the correct Name";
    } else {
      response.fnameStatus = '';
    }


    // Email Validation
    if (email && (email.trim() === "")) {
      response.fnameStatus =
        "Please enter email";
    } else if (!/^[^\s@]+@(?!.*\.[^\s@]+)[a-zA-Z\d-]+\.(com|org|in|net|edu|gov|co|uk)$/.test(email)) {
      response.emailStatus = "Please enter valid email";
    } else {
      response.emailStatus = '';
    }
    //Mobile Number Validation

    if (mobile && (mobile.trim() === "" || mobile.length < 10 || !/^\d{10}$/.test(mobile))) {
      response.mobileStatus = "Enter valid Number";
    } else {
      response.mobileStatus = "";
    }

    // Password Validation

    if (password && password.trim() === "") {
      response.passwordStatus = "Password cannot be Empty";
    } else if (password && password.length <= 8) {
      response.passwordStatus = "Password must be at least 8 characters long";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-_+=])[A-Za-z\d!@#$%^&*()-_+=]{8,}$/.test(password)) {
      response.passwordStatus = "Password must include lowercase and uppercase letters, numbers, and special characters";
    } else {
      response.passwordStatus = "";
    }

    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});






//Create User

const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    const newName=name.charAt(0).toUpperCase()+name.slice(1)
    // Check if the user already exists
    const findUser = await User.findOne({ email: email.trim() });
    if (!findUser) {
      // Create new user
      const newUser = await User.create({
        name: newName,
        mobile: mobile,
        email: email,
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


//send OTP

const sendOTP = asyncHandler(async ({ email, res }) => {
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`
    console.log(email);
    const data = {
      to: email,
      text: 'Hey User',
      subject: 'coza store OTP ',
      htm: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #007BFF;">Verify Your Email</h2>
        <p>Please use the following OTP to verify your email:</p>
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #007BFF;">${otp}</h3>
        </div>
        <p>This OTP is valid for a short period. Do not share it with anyone.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <P style="color: #007BFF;">From Coza Store </p>
    </div>
`,
    }
    // const saltrounds = 10
    // OTP

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")
    console.log(hashedOtp);
    const newOtpVerification = await new mailOTP({
      email: email,
      otp: hashedOtp,
      createdAt: new Date()
    })
    // save otp record
    await newOtpVerification.save()
    sendEmail(data);
  } catch (error) {
    throw new Error(error)
  }
})

// resend Otp
const resendOTP = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email;
    const resendEmail = {
      email: email
    }
    await mailOTP.deleteOne({ email: email });
    sendOTP(resendEmail);
    res.json({ success: true, otp: 'OTP sent successfully', email });

  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    req.flash('head', 'Please verify your email');
    res.redirect('/register');
  }
});

//Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email
    const otp = req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six;
    const user = await mailOTP.findOne({ email: email })
    if (!user) {
      req.flash('otp', "otp expired")
      res.render('otp', { email });     //{ message: "otp expired" }
    }

    const { otp: hashedOtp } = user;
    const uotp = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOtp === uotp) {

      const userData = await User.findOne({ email: email })
      await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } })
      await mailOTP.deleteOne({ email: email });

      const refreshToken = await generateRefreshToken(userData?._id);
      // Update user's refresh token in the database
      const updateUser = await User.findByIdAndUpdate(
        userData.id,
        { refreshToken },
        { new: true }
      );

      // Set a cookie with the refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      });



      req.cookies.user_id = userData._id
      // req.flash('head', ' Regestered Successfully Please Login... ');
      res.redirect('/');

    } else if (hashedOtp) {

      res.render('otp', { message: req.flash('otp', 'otp is incorrect'), email: email });

    } else {
      await User.findOneAndDelete({ email })
      req.flash('info', ` OTP timeout Register again `);
      res.redirect('/login')
    }

  } catch (error) {
    await User.findOneAndDelete({ email })
    console.log(error);
  }

});

const loginUserCtrl = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const findUser = await User.findOne({ email });

    if (findUser && (await findUser.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findUser?._id);

      // Update user's refresh token in the database
      const updateUser = await User.findByIdAndUpdate(
        findUser.id,
        { refreshToken },
        { new: true }
      );

      // Set a cookie with the refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      });

      // Render the "index" view
      res.redirect('/');
    } else {
      // Redirect to "/userLogin" for invalid credentials
      req.flash('login', 'Invalid credentials')
      res.redirect('/register');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//Handle refresh Token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies
  if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
  const refreshToken = cookie.refreshToken
  const user = await User.findOne({ refreshToken })
  if (!user) throw new Error("No refresh Token present in DB or Not matched")
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decode) => {
    if (err || user.id != decode.id) {
      throw new Error("Something wrong with refresh Token")
    }
    const accessToken = generateToken(user?._id)
    res.json({ accessToken })
  })
});

//Logout functionality
const logout = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("No refresh Token in cookies")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      return res.sendStatus(204)//forbidden

    }
    await User.findOneAndUpdate({ refreshToken: refreshToken }, {
      refreshToken: "",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    })
    res.redirect('/');

  } catch (error) {
    throw new Error(error)
  }
});

//Update a User
const updateUser = asyncHandler(async (req, res) => {
  const { name, mobile, dob } = req.body
  const newName=name.charAt(0).toUpperCase()+name.slice(1)
  const accessToken = req.accessToken
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const user = await User.findById({ _id: userId });
    if (user) {
      const updateFields = {
        $set: {
          name:newName,
          mobile,
          dob
        },
      };
      await User.findOneAndUpdate(
        { _id: userId },
        updateFields,
        { new: true, upsert: true }
      );
      req.flash('head', 'Profile Udated Successfully')
      res.redirect('/user/account')
    } else {
      res.redirect('/user/account')
    }
  } catch (error) {
    throw new Error(error)
  }
});


//Get all Users

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin/userDetails', { users })
  } catch (error) {
    throw new Error(error);

  }
});
//Get a single User

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const getaUser = await User.findById(id)
    res.json({ getaUser })
  } catch (error) {
    throw new Error(error)
  }

});

//Delete a User

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  console.log(id);
  try {
    const deleteaUser = await User.findByIdAndDelete({ _id: id })
    console.log(deleteaUser);
    res.json({ deleteaUser })
  } catch (error) {
    throw new Error(error)
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const redirectUrl = req.body.redirectUrl || '/admin/getAllUsers';

  try {
    await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true });
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const redirectUrl = req.body.redirectUrl || '/admin/getAllUsers';

  try {
    await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true });
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Update Password

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  try {
    validateMongoDbId(_id)
    const user = await User.findById(_id)
    if (password) {
      user.password = password;
      const updatedPassword = await user.save()
      console.log(updatedPassword);
      res.json(updatedPassword)
    } else {
      res.json(user)
    }
  } catch (error) {
    throw new Error(error)
  }

});

//Forgot Password Token
const forgotPasswordToken = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      throw new Error('User not found with this email');
    }

    const token = await user.createPasswordResetToken();
    await user.save();

    // Construct the HTML content of the email
    const resetLink = `http://localhost:3000/createPassword/${token}`;
    const emailBody = `
      <p>Dear User,</p>
      <p>You have requested to reset your password. Click the link below to reset your password:</p>
      <h5><a href="${resetLink}">Reset Password</a></h5>
      <p>This link is valid for 10 minutes.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    `;

    const data = {
      to: email,
      subject: 'Coza Store Password Reset',
      htm: emailBody,
    };

    // Assuming you have a synchronous sendEmail function
    sendEmail(data);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//reset Password

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.id;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })
    if (!user) {
      req.flash('head', 'Token Expired Please try again later')
      res.redirect('/login')
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()
    req.flash('head', 'Password Created Successfully')
    res.redirect('/login')
  } catch (error) {
    throw new Error(error)
  }
});
const updateProfileIcon= asyncHandler(async (req, res) => {
  try {
    const {photoUrl}=req.body
    console.log(photoUrl);
    const accessToken = req.accessToken;
const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
const userId = decodedToken.id;

    await User.findByIdAndUpdate({_id:userId },{$set:{icon:photoUrl}});
    res.send(photoUrl);
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = {
  userHome, userLogin, createUser,
  loginUserCtrl,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  userRegister,
  verifyOtp,
  sendOTP,
  resendOTP,
  validateUser,
  loadCreatePassword,
  loadVerifyEmailPage,
  userAccount,
  updateProfileIcon,

  // verifySignup
}