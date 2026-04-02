let express = require('express')
let router = express.Router()
let cartModel = require('../schemas/carts')
let { CheckLogin } = require('../utils/authHandler')
let inventoryModel = require('../schemas/inventories')

async function sanitizeCart(cart) {
    if (!cart) return cart;
    let before = cart.items.length;
    cart.items = cart.items.filter(i => i.size);
    if (cart.items.length !== before) {
        await cart.save();
    }
    return cart;
}

router.get('/', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    }).populate('items.product', 'title price images')
    cart = await sanitizeCart(cart);
    res.send(cart.items)
})
router.post('/add', CheckLogin, async function (req, res, next) {
    let { product, quantity, size } = req.body;
    if (!size) {
        res.status(400).send("size is required");
        return;
    }
    let getProduct = await require('../schemas/products').findOne({
        _id: product,
        isDeleted: false
    })
    if (!getProduct) {
        res.status(404).send("product khong ton tai");
        return;
    }
    let sizeEntry = (getProduct.sizes || []).find(s => String(s.size) === String(size));
    if (!sizeEntry) {
        res.status(404).send("size khong ton tai");
        return;
    }
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    cart = await sanitizeCart(cart);
    let index = cart.items.findIndex(
        function (e) {
            return e.product == product && String(e.size) === String(size)
        }
    )
    if (index > -1) {
        if (sizeEntry.stock >= (cart.items[index].quantity + quantity)) {
            cart.items[index].quantity += quantity
            await cart.save();
            res.send(cart)
        } else {
            res.status(404).send("product khong con du hang");
        }
    } else {
        if (sizeEntry.stock >= quantity) {
            cart.items.push({
                product: product,
                size: size,
                quantity: quantity
            })
            await cart.save();
            res.send(cart)
        } else {
            res.status(404).send("product khong con du hang");
        }

    }
})
router.post('/remove', CheckLogin, async function (req, res, next) {
    let { product, quantity, size } = req.body;
    if (!size) {
        res.status(400).send("size is required");
        return;
    }
    let getProduct = await require('../schemas/products').findOne({
        _id: product,
        isDeleted: false
    })
    if (!getProduct) {
        res.status(404).send("product khong ton tai");
        return;
    }
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    cart = await sanitizeCart(cart);
    let index = cart.items.findIndex(
        function (e) {
            return e.product == product && String(e.size) === String(size)
        }
    )
    if (index > -1) {
        if (cart.items[index].quantity > quantity) {
            cart.items[index].quantity -= quantity;
            await cart.save()
            res.send(cart);
        } else {
            if (cart.items[index].quantity == quantity) {
                cart.items.splice(index, 1);
                await cart.save();
                res.send(cart);
            } else {
                res.status(404).send("khong duoc xoa ve am");
            }
        }
    } else {
        res.status(404).send("product khong ton tai");
    }
})

module.exports = router;
