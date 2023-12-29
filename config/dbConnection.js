const mongoose = require('mongoose');

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log('db connected');
  } catch (error) {
    console.error('db error:', error.message);
  }
};

module.exports = dbConnect;






// const { default: mongoose } = require("mongoose")

// const dbConnect=async ()=>{
//     try {
//         const conn= await mongoose.connect(process.env.MONGODB_URL);
//         console.log('db connected');
//     } catch (error) {
//         console.log('db error');
//     }
// }
// module.exports=dbConnect