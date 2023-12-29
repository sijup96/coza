const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
        
    },
    numViews:{
        type:Number,
        
    },
    isLiked:{
        type:Boolean,
        default:false,
    },
    isDisliked:{
        type:Boolean,
        default:false,
    },
    likes:[{
        type:mongoose.Types.ObjectId,
        ref:"User",
    },],
    dislikes:[{
        type:mongoose.Types.ObjectId,
        ref:"User",
    },],
image:{
    type:String,
    default:"/coza/public/images/blog1.webp",
},
author:{
    type:String,
    default:"Admin",
},

},
{
    toJSON:{
        virtuals:true,
    },
    toObject:{
        virtuals:true,
    },
    timestamps:true,
});

//Export the model
module.exports = mongoose.model('Blog', blogSchema);