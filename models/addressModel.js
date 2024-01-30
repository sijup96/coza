const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique:true,
        // index:true,
    },
    mobile: {
        type: Number,
    },
    houseName: {
        type: String,
    },
    street: {
        type: String,
    },
    landmark: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    city: {
        type: String,
    }

}, { timestamps: true });

//Export the model
module.exports = mongoose.model('Address', addressSchema);