const mongoose = require('mongoose');
const inventoryModel = require('./schemas/inventories');

async function updateStock() {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD');
        console.log("Connected to MongoDB");
        
        const result = await inventoryModel.updateMany({}, { stock: 100 });
        console.log(`Updated stock to 100 for ${result.modifiedCount} products. Matched: ${result.matchedCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error updating stock:", error);
        process.exit(1);
    }
}

updateStock();
