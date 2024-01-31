const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique:true,
        // index:true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
    },
    default: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });

//Export the model
module.exports = mongoose.model('Address', addressSchema);