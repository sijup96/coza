const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var prodCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        // unique:true,
        //  index:true,
    },
    slug: {
        type: String,
        required: true,

    },
    description: {
        type: String,
        required: true,
    },
    offer:{
        type: mongoose.Types.ObjectId,
        ref:'Offer'
    },
    is_listed: {
        type: Boolean,
        default: true,
    },

}, { timestamps: true });

//Export the model
module.exports = mongoose.model('productCategory', prodCategorySchema);