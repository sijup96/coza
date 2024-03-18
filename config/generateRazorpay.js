const Razorpay = require('razorpay');
const asyncHandler = require('express-async-handler');

// Function to create a new instance of Razorpay
const razorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const generateRazorpay = asyncHandler(async (orderId, amount) => {
  // Create Razorpay instance
  const instance = razorpayInstance();
  // Create order options
  const options = {
    amount: amount * 100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: orderId,
  };
  // Use async/await to create order
  try {
    const order = await instance.orders.create(options);
    console.log(order);
    return order; 
  } catch (err) {
    console.error(err);
    throw err; // Re-throw the error to be caught elsewhere if needed
  }
});

module.exports = generateRazorpay;
