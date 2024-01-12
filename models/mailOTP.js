const mongoose = require('mongoose')

const mailOTPSchema = new mongoose.Schema({
    email: {
        type: String
    },
    otp: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    expiresAt: {
        type: Date
    }
})

mailOTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 })

module.exports = mongoose.model('mailOTP', mailOTPSchema)

