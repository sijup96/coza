const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel')
const asyncHandler = require("express-async-handler")
const validateMongoDbId = require('../utils/validateMongodbId')
const { generateRefreshToken } = require('../config/refreshToken');
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const sendEmail = require('./emailCtrl')
const crypto = require('crypto');
const mailOTP = require('../models/mailOTP')
const bcrypt=require('bcrypt');

/* GET home page. */
const userHome = asyncHandler(async (req, res) => {
  res.render('index')
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
      req.flash('message', 'Please Login');
      res.render('userLogin');
    } else {
      // Render 'index' if refreshToken cookie is present
      res.render('index');
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
  res.redirect('/login')
});

//Create User

const createUser = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email;

    // Check if the user already exists
    const findUser = await User.findOne({ email: email });

    if (!findUser) {

      // Create new user

      const newUser = await User.create(req.body);
      sendOTP(newUser);
      
      res.render('otp',{email})
      
    } else {
      req.flash('message', `Hi ${req.body.name}, Already Regestered Please Login... `);

      // User already exists
      res.redirect('userLogin');
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    req.flash('message', 'Invalid credentials');
  }
});


//send OTP

const sendOTP=asyncHandler(async ({email,res})=>{
try {
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`

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





//Verify OTP

const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email
    console.log('email:', req.body.email);
    const otp = req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six;

console.log(otp);

    const user = await mailOTP.findOne({ email: email })
    console.log('user:', user);

    if (!user) {
      res.render('otp');     //{ message: "otp expired" }
    }

    const { otp: hashedOtp } = user;
    const uotp = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOtp === uotp) {

      const userData = await User.findOne({ email: email })
      await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } })
      await mailOTP.deleteOne({ email: email });

      req.cookies.user_id = userData._id
      req.flash('info', ` Regestered Successfully Please Login... `);
      res.redirect('/login');

    } else if(hashedOtp){
      
      res.render('otp', { message: req.flash('otp', 'otp is incorrect'), email: email });

    }else{
      await User.findOneAndDelete({email})
      req.flash('info', ` OTP timeout Register again `);
      res.redirect('/login')
    }

  } catch (error) {
    await User.findOneAndDelete({email})
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

      res.redirect('userLogin');
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
  const { _id } = req.user
  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        name: req?.body?.name,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true
      }

    )
    res.json(updatedUser)
  } catch (error) {
    throw new Error(error)
  }
});

//Get all Users

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin/userDetails',{users})
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
  const { id } = req.params
  try {
    const block = await User.findByIdAndUpdate({ _id: id },
      {
        isBlocked: true,
      }, {
      new: true
    })
    res.json({
      message: "User Blocked"
    })
  } catch (error) {
    throw new Error(error)

  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const unblock = await User.findByIdAndUpdate(id,
      {
        isBlocked: false,
      }, {
      new: true
    })
    res.json({
      message: "User UnBlocked"
    })
  } catch (error) {
    throw new Error(error)

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
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) throw new Error('User not found with this email')
  try {
    const token = await user.createPasswordResetToken()
    await user.save();
    const resetURL = otp
    //`Link to reset password (10 minute) <a href="http://localhost:3000/api/user/reset-password/${token}">Click here</>`
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
          <P style="color: #007BFF;">From Vogue Vista </p>
      </div>
  `,
    }
    sendEmail(data);
    res.render('otp')

  } catch (error) {
    throw new Error(error)
  }
});

//reset Password

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })
  if (!user) throw new Error('Token Expired Please try again later')
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save()
  res.json(user);

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

  // verifySignup
}