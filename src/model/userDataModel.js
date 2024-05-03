const mongoose = require("mongoose")
const moment = require("moment");
require("moment-timezone");

moment.tz.setDefault("Asia/Kolkata");
let dates = moment().format("YYYY-MM-DD");
let times = moment().format("HH:mm:ss");
const UserDataSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        // unique: true,
        trim: true
    },
    phone:{
        type: String,
        require: true,
    },
    location:{
        type: String,
        require: true,
    },
    vehicleNumber:{
        type: String,
        require: true,
        // require: true,
     },
     url:{
        type: String,
        require: true,
     },
    deletedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    
    date: {
        type: String,
        default:dates
    },
    time:{
        type:String,
        default:times
    }
}, { timestamps: true })
module.exports = mongoose.model('UserData', UserDataSchema)