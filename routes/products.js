var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');//dbContext
let inventoryModel = require('../schemas/inventories')
const { default: slugify } = require('slugify');
let mongoose = require('mongoose')
let { CheckLogin, checkRole } = require('../utils/authHandler')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let queries = req.query;
  let minPrice = queries.minprice ? queries.minprice : 0;
  let maxPrice = queries.maxprice ? queries.maxprice : 10000000;
  let titleQ = queries.title ? queries.title : '';
  
  let findConditions = {
    isDeleted: false,
    title: new RegExp(titleQ, 'i'),
    price: {
      $gte: minPrice,
      $lte: maxPrice
    }
  };
  
  if (queries.category) findConditions.category = queries.category;
  if (queries.brand) findConditions.brand = queries.brand;

  let result = await productModel.find(findConditions).populate([
    {
      path: 'category',
      select: 'name'
    },
    {
      path: 'brand',
      select: 'name'
    }
  ])
  // result = result.filter(
  //   function (e) {
  //     return e.price >= minPrice && e.price <= maxPrice
  //       && e.title.toLowerCase().includes(titleQ.toLowerCase())
  //   }
  // )
  res.send(result);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.findOne({
      isDeleted: false,
      _id: id
    }).populate([
      {
        path: 'category',
        select: 'name'
      },
      {
        path: 'brand',
        select: 'name'
      }
    ])
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
    let newProduct = new productModel({
      sku: req.body.sku,
      title: req.body.title,
      slug: slugify(req.body.title, {
        replacement: '-',
        remove: undefined,
        lower: true,
        strict: false,
      }),
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      brand: req.body.brand,
      images: req.body.images
    });
    newProduct = await newProduct.save();
    let newInventory = new inventoryModel({
      product: newProduct._id
    })
    newInventory = await newInventory.save();
    newInventory = await newInventory.populate('product')
    res.send(newInventory)
  } catch (error) {
    res.send(error.message)
  }
})
router.put('/:id', CheckLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    //c1
    // let result = await productModel.findOne({
    //   isDeleted: false,
    //   _id: id
    // })
    // if (result) {
    //   let keys = Object.keys(req.body);
    //   for (const key of keys) {
    //     result[key] = req.body[key]
    //   }
    //   await result.save()
    //   res.send(result)
    // }
    // else {
    //   res.status(404).send({ message: "ID NOT FOUND" });
    // }
    //c2
    let updatedItem = await productModel.findByIdAndUpdate(id, req.body, {
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
    //c1
    // let result = await productModel.findOne({
    //   isDeleted: false,
    //   _id: id
    // })
    // if (result) {
    //   let keys = Object.keys(req.body);
    //   for (const key of keys) {
    //     result[key] = req.body[key]
    //   }
    //   await result.save()
    //   res.send(result)
    // }
    // else {
    //   res.status(404).send({ message: "ID NOT FOUND" });
    // }
    //c2
    let updatedItem = await productModel.findByIdAndUpdate(id, {
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
