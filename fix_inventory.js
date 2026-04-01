const mongoose = require('mongoose');
const productModel = require('./schemas/products');
const inventoryModel = require('./schemas/inventories');

async function fix() {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD');
        const products = await productModel.find();
        console.log("Found", products.length, "products.");
        let fixed = 0;
        for (let p of products) {
            let inv = await inventoryModel.findOne({ product: p._id });
            if (!inv) {
                console.log("Creating inventory record for", p.title);
                inv = new inventoryModel({ product: p._id, stock: 100 });
                await inv.save();
                fixed++;
            } else if (inv.stock < 100) {
                inv.stock = 100;
                await inv.save();
                fixed++;
            }
        }
        console.log("Done. Fixed: ", fixed);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
fix();
