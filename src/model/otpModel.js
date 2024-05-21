const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const otpSchema = new mongoose.Schema({
    otp: {
        type: Number,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        //unique: true,
        trim: true
    },
    expiry: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('otp', otpSchema);
