"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DummyProducts_1 = require("../data/DummyProducts");
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
};
const addSlugsToProducts = () => {
    DummyProducts_1.dummyProducts.forEach((product, index) => {
        if (product.title && !product.slug) {
            product.slug = generateSlug(product.title);
        }
    });
};
addSlugsToProducts();
DummyProducts_1.dummyProducts.forEach((product, index) => {
});
exports.default = addSlugsToProducts;
