let mongoose = require('mongoose');
let brandSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, "name khong duoc trung"],
        required: [true, "name khong duoc rong"]
    },
    slug: {
        type: String,
        unique: [true, "slug khong duoc trung"],
        required: [true, "slug khong duoc rong"]
    },
    description: {
        type: String,
        default: ""
    },
    logo: {
        type: String,
        default: "https://i.imgur.com/ZANVnHE.jpeg"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model(
    'brand', brandSchema
)
