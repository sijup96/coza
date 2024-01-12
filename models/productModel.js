const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title:{
        type:String,
       // required:true,
        trim:true,
    },
    slug:{
        type:String,
       // required:true,
       // unique:true,
      //  lowercase:true,
    },
    description:{
        type:String,
       // required:true,
    },
    price:{
        type:Number,
      //  required:true,
    },
    size:{
        type:String,
      //  required:true,
    },
    category:{
        type:mongoose.Types.ObjectId,
        ref:"Category",
        //  required:true,        
    },
    brand:{
type:String,
//required:true,          //enum:['Apple','Samsung','Lenovo']
    },
    quantity:{
        type:Number,
      //  required:true,
    },
    sold:{
        type:Number,
        default:0,
        
    },
    images:{
        type:Array,
    },
    color:{
        type:String,
       // required:true,         //enum:['Black','Brown','Red'],
    },
    is_listed: {
        type: Boolean,
        default: true
    },
    ratings:[{
        star:Number,
        postedby:{type:mongoose.Types.ObjectId,ref:"User"}
    },
],
},
{timestamps:true}
);

//Export the model
module.exports = mongoose.model('Product', productSchema);