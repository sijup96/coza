const User = require('../models/userModel');
const asyncHandler = require("express-async-handler")
const jwt = require('jsonwebtoken');
const Address = require('../models/addressModel')
const Cart = require('./cartCtrl')



//Load Address Page
const loadUserAddress = asyncHandler(async (req, res) => {
  const accessToken = req.accessToken
  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const userData = await Address.find({ user: userId }).populate('user')
    res.render('userAddresses', { userData });
  } catch (error) {
    throw new Error(error)
  }
});
//Get a Address 
const getAddress = asyncHandler(async (req, res) => {
  try {
    const addressId=req.params.id;
    const addressData= await Address.findById(addressId);
    if(!addressData){
      return res.status(404).json({error:'Address not found'});
    }
    res.json(addressData);
  } catch (error) {
    throw new Error(error)
  }
});

//Load Create Address
const loadCreateAddress = asyncHandler(async (req, res) => {
  try {
    res.render('createAddress');
  } catch (error) {
    throw new Error(error)
  }
});

//Create Address
const createAddress = asyncHandler(async (req, res) => {
  try {
    const { name, mobile, houseName, street, landmark, pincode, city, state, defaultAddress } = req.body;
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const newName = name.charAt(0).toUpperCase() + name.slice(1)
    const newHouseName = houseName.charAt(0).toUpperCase() + houseName.slice(1)
    const newStreet = street.charAt(0).toUpperCase() + street.slice(1)
    const newLandmark = landmark.charAt(0).toUpperCase() + landmark.slice(1)
    const newCity = city.charAt(0).toUpperCase() + city.slice(1)
    const newState = state.charAt(0).toUpperCase() + state.slice(1)
    if (userId) {
      // Create new Address
      const newAddress = await Address.create({
        name: newName,
        user: userId,
        mobile,
        houseName: newHouseName,
        street: newStreet,
        landmark: newLandmark,
        pincode,
        city: newCity,
        state: newState
      });
      if (defaultAddress) {
        makeDefaultAddress({ addressId: newAddress._id, userId: userId });
      }
      if (newAddress) {
        res.status(200).json({ success: true, message: 'Address added successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Try again...' });
      }

    } else {
      res.status(500).json({ success: false, message: 'Try again...' });

    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    throw new Error(error)
  }
});
// Delete Address
const deleteAddress = asyncHandler(async (req, res) => {
  try {
    const _id = req.params.id;
    const result = await Address.findByIdAndDelete({ _id });

    if (result) {
      res.status(200).json({ message: 'Address deleted successfully' });
    } else {
      // Handle case where the address with the given ID was not found
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// Make Default Address
const defaultAddress = asyncHandler(async (req, res) => {
  try {
    const addressId = req.params.id
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    makeDefaultAddress({ addressId, userId })
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
});
// Load edit Address
const loadEditAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id;
  const address = await Address.findById({ _id: addressId });
  res.render('editAddress', { address })
})

// Make Default Address Function
const makeDefaultAddress = asyncHandler(async ({ addressId, userId, res }) => {
  await Address.updateMany({ user: userId }, { $set: { default: false } })
  await Address.findByIdAndUpdate({ _id: addressId }, { $set: { default: true } })
});

// Update Address
const editAddress = asyncHandler(async (req, res) => {
  try {
    const addressId = req.params.id
    const { name, mobile, houseName, street, landmark, pincode, city, state } = req.body;
    const newName = name.charAt(0).toUpperCase() + name.slice(1)
    const newHouseName = houseName.charAt(0).toUpperCase() + houseName.slice(1)
    const newStreet = street.charAt(0).toUpperCase() + street.slice(1)
    const newLandmark = landmark.charAt(0).toUpperCase() + landmark.slice(1)
    const newCity = city.charAt(0).toUpperCase() + city.slice(1)
    const newState = state.charAt(0).toUpperCase() + state.slice(1)
    if (addressId) {
      // Create new Address
      await Address.findByIdAndUpdate(
        addressId,
        {
          $set: {
            name: newName,
            mobile,
            houseName: newHouseName,
            street: newStreet,
            landmark: newLandmark,
            pincode,
            city: newCity,
            state: newState
          }
        },
        { new: true } // To return the updated document
      );
      res.status(200).json({ success: true, message: 'Address edited successfully' });

    } else {
      res.status(400).json({ success: false, message: 'Failed to edit address. Please try again.' });

    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    throw new Error(error)
  }
});

module.exports = {
  loadUserAddress,
  loadCreateAddress,
  createAddress,
  deleteAddress,
  defaultAddress,
  loadEditAddress,
  editAddress,
  getAddress,
}