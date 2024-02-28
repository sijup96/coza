const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        require: true,

    },
    slug: {
        type: String,
        require: true,

    },
    startingDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        require: true,
        validate: {
            validator: function () {
                return this.startingDate < this.expiryDate;
            },
            message: 'Starting date must be before expiry date..',
        },
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    is_listed: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model('Offer', offerSchema);
