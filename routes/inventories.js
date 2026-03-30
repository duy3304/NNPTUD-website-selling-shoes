var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');
let productModel = require('../schemas/products');
let { CheckLogin, checkRole } = require('../utils/authHandler')

router.get('/', async function (req, res, next) {
    let result = await inventoryModel.find({}).populate('product')
    res.send(result);
});

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await inventoryModel.findOne({
            _id: id
        }).populate('product')
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "ID NOT FOUND" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.post('/', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let { product, stock, reserved, soldCount } = req.body;
        let existProduct = await productModel.findOne({
            _id: product,
            isDeleted: false
        })
        if (!existProduct) {
            res.status(404).send({ message: "product not found" });
            return;
        }
        let existed = await inventoryModel.findOne({
            product: product
        })
        if (existed) {
            res.status(400).send({ message: "inventory already exists" });
            return;
        }
        let newItem = new inventoryModel({
            product: product,
            stock: stock,
            reserved: reserved,
            soldCount: soldCount
        })
        await newItem.save()
        newItem = await newItem.populate('product')
        res.send(newItem)
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.put('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await inventoryModel.findByIdAndUpdate(id, req.body, {
            new: true
        }).populate('product');
        res.send(updatedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.delete('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let deletedItem = await inventoryModel.findByIdAndDelete(id);
        if (!deletedItem) {
            res.status(404).send({ message: "ID NOT FOUND" });
            return;
        }
        res.send(deletedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;
