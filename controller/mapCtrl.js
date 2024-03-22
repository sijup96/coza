const { createClient } = require("@google/maps");
const { promisify } = require("util");
const asyncHandler = require("express-async-handler");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Create a Google Maps client with the API key
const Map = createClient({
  key: process.env.MAP_API_KEY,
});
// Promisify the DistanceMatrixService method
const getDistanceMatrixPromise = promisify(Map.distanceMatrix);
const getPlaceDetailsPromise = promisify(Map.places);
// get Distance
const getDistance = asyncHandler(async (req, res) => {
  try {
    const accessToken = req.accessToken;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const addressId = req.params.id;
    const cartData = await Cart.findOne({ userId: userId });
    const selectedAddress = await Address.findById(addressId);
    const distanceText= await calculateDistance(selectedAddress.pincode);
    const numericalDistance = parseInt(distanceText.split(" ")[0]);
    let shippingCharge = 0;
    if(cartData.cartTotal<1000){
    if (numericalDistance > 20 && numericalDistance <= 50) {
      shippingCharge = 50;
    } else if (numericalDistance > 50 && numericalDistance <= 100) {
      shippingCharge = 70;
    } else if (numericalDistance > 100) {
      shippingCharge = 100;
    }
}
    res.status(200).json({ shippingCharge, cartTotal:cartData.cartTotal });
  } catch (error) {
    res.status(500).json({ error: "Invalid pincode" });
    console.error("Error:", error);
  }
});

// Calculate delivery Distance
const calculateDistance= async(destinationPincode)=>{
 // Define the origin and destination
 const origin = "678572";
 const destination = destinationPincode;
// Build the request object for Distance Matrix API
const request = {
    origins: [origin],
    destinations: [destination],
  };
      // Make the Distance Matrix API request using the promisified function
      const response = await getDistanceMatrixPromise(request);
      // Get the distance from the response
      const distanceText = response.json.rows[0].elements[0].distance.text;
      const distanceValue = response.json.rows[0].elements[0].distance.value;

  return distanceText
};


// const getCityStateFromPlaceDetails = (placeDetails) => {
//   if (!placeDetails || placeDetails.length === 0) {
//     throw new Error("No place details found");
//   }

//   // Assuming the first result contains the relevant information
//   const firstResult = placeDetails[0];

//  console.log(firstResult.formatted_address);
// };

// // Define the function to fetch place details
// const getPlaceDetails = async (pincode) => {
//   try {
//     const response = await getPlaceDetailsPromise({ query: pincode });
//     const placeDetails = response.json.results;
//     return placeDetails;
//   } catch (error) {
//     throw new Error("Failed to fetch place details");
//   }
// };

// // Example usage
// const pincode = '678572';
// getPlaceDetails(pincode)
//   .then((placeDetails) => {
//     const { city, state } = getCityStateFromPlaceDetails(placeDetails);
//     console.log("City:", city);
//     console.log("State:", state);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });
module.exports = { getDistance,calculateDistance };
