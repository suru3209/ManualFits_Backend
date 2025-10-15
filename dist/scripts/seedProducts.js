"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const DummyProducts_1 = require("../data/DummyProducts");
const db_1 = __importDefault(require("../config/db"));
dotenv_1.default.config();
const seedProducts = async () => {
    try {
        await (0, db_1.default)();
        await ProductModal_1.default.deleteMany({});
        const productsWithSlugs = DummyProducts_1.dummyProducts.map((product) => {
            if (!product.slug && product.title) {
                product.slug = product.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .trim();
            }
            return product;
        });
        const insertedProducts = await ProductModal_1.default.insertMany(productsWithSlugs);
        const categories = [...new Set(insertedProducts.map((p) => p.category))];
        categories.forEach((category) => {
            const count = insertedProducts.filter((p) => p.category === category).length;
        });
        let totalVariants = 0;
        insertedProducts.forEach((product) => {
            if (product.variants) {
                product.variants.forEach((size) => {
                    totalVariants += size.variants.length;
                });
            }
        });
        const allPrices = [];
        insertedProducts.forEach((product) => {
            if (product.variants) {
                product.variants.forEach((size) => {
                    size.variants.forEach((variant) => {
                        allPrices.push(variant.price);
                    });
                });
            }
        });
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        let totalStock = 0;
        insertedProducts.forEach((product) => {
            if (product.variants) {
                product.variants.forEach((size) => {
                    size.variants.forEach((variant) => {
                        totalStock += variant.stock;
                    });
                });
            }
        });
        await mongoose_1.default.connection.close();
    }
    catch (error) {
        console.error("❌ Error seeding products:", error);
        process.exit(1);
    }
};
if (require.main === module) {
    seedProducts();
}
exports.default = seedProducts;
