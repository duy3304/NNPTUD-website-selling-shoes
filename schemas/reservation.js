let mongoose = require('mongoose')
let reservationItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product'
    },
    size: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        min: 1
    },
    price: {
        type: Number,
        min: 0
    },
    subtotal: {
        type: Number,
        min: 0
    }
})
let reservationSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: {
        type: [reservationItemSchema],
        default: []
    },
    status: {
        type: String,
        enum: ["actived", "cancelled", "expired", "paid"],
        default: "actived"
    },
    expiredIn: Date,
    amount: {
        type: Number,
        min: 0
    },
    shippingAddress: {
        type: String,
        default: ""
    },
    shippingName: {
        type: String,
        default: ""
    },
    shippingPhone: {
        type: String,
        default: ""
    },
    shippingNote: {
        type: String,
        default: ""
    },
    paymentMethod: {
        type: String,
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING"
    },
    momoOrderId: String,
    momoRequestId: String,
    momoTransId: String
}, {
    timestamps: true
})

module.exports = new mongoose.model('reservation', reservationSchema)
