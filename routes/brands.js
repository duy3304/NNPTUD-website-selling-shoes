var express = require('express');
var router = express.Router();
let brandModel = require('../schemas/brands');
const { default: slugify } = require('slugify');
let { CheckLogin, checkRole } = require('../utils/authHandler')

router.get('/', async function (req, res, next) {
    let result = await brandModel.find({
        isDeleted: false
    })
    res.send(result);
});

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await brandModel.findOne({
            isDeleted: false,
            _id: id
        })
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
    let newItem = new brandModel({
        name: req.body.name,
        slug: slugify(req.body.name, {
            replacement: '-',
            remove: undefined,
            lower: true,
            strict: false,
        }),
        description: req.body.description,
        logo: req.body.logo
    });
    await newItem.save();
    res.send(newItem)
})

router.put('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await brandModel.findByIdAndUpdate(id, req.body, {
            new: true
        });
        res.send(updatedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.delete('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await brandModel.findByIdAndUpdate(id, {
            isDeleted: true
        }, {
            new: true
        });
        res.send(updatedItem)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;
