var express = require("express");
var router = express.Router();
let reservationModel = require('../schemas/reservation')
let inventoryModel = require('../schemas/inventories')
let productModel = require('../schemas/products')
let mongoose = require('mongoose')
let { CheckLogin, checkRole } = require('../utils/authHandler')

// get all reservations (admin/mod)
router.get('/', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    let result = await reservationModel.find({})
        .populate('user', 'username email')
        .populate('items.product', 'title price')
    res.send(result)
})

// get reservations of current user
router.get('/me', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let result = await reservationModel.find({
        user: user._id
    }).populate('items.product', 'title price')
    res.send(result)
})

router.get('/:id', CheckLogin, async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await reservationModel.findOne({
            _id: id
        }).populate('items.product', 'title price')
        if (!result) {
            res.status(404).send({ message: "ID NOT FOUND" });
            return;
        }
        if (req.user.role.name !== "ADMIN") {
            if (String(result.user) !== String(req.user._id)) {
                res.status(403).send({ message: "ban khong co quyen" });
                return;
            }
        }
        res.send(result);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.post('/', CheckLogin, async function (req, res, next) {
    try {
        let user = req.user;
        let items = req.body.items || [];
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).send({ message: "items is required" });
            return;
        }
        let resultItems = [];
        let amount = 0;
        for (const item of items) {
            let product = await productModel.findOne({
                _id: item.product,
                isDeleted: false
            })
            if (!product) {
                throw new Error("product not found");
            }
            if (!item.size) {
                throw new Error("size is required");
            }
            let sizeEntry = (product.sizes || []).find(s => String(s.size) === String(item.size));
            if (!sizeEntry || sizeEntry.stock < item.quantity) {
                throw new Error("product khong con du hang");
            }
            let subtotal = product.price * item.quantity;
            amount += subtotal;
            resultItems.push({
                product: product._id,
                size: item.size,
                title: product.title,
                quantity: item.quantity,
                price: product.price,
                subtotal: subtotal
            })
            sizeEntry.stock -= item.quantity;
            await product.save()
        }
        let newReservation = new reservationModel({
            user: user._id,
            items: resultItems,
            status: "actived",
            expiredIn: req.body.expiredIn,
            amount: amount
        })
        newReservation = await newReservation.save()
        res.send(newReservation)
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.put('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await reservationModel.findByIdAndUpdate(id, req.body, {
            new: true
        })
        res.send(updatedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
})

router.delete('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let deletedItem = await reservationModel.findByIdAndDelete(id);
        if (!deletedItem) {
            res.status(404).send({ message: "ID NOT FOUND" });
            return;
        }
        res.send(deletedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
})

module.exports = router;
