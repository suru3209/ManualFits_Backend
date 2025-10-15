"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DummyProducts_1 = require("../data/DummyProducts");
const fs_1 = __importDefault(require("fs"));
const imageUrls = {
    tshirt: {
        white: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=600&fit=crop&crop=center",
        ],
        black: [
            "https://images.unsplash.com/photo-1583743814966-8936f37f2c7a?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop&crop=center",
        ],
        navy: [
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=600&fit=crop&crop=center",
        ],
    },
    jeans: {
        blue: [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
        ],
        black: [
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&crop=center",
        ],
        light: [
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&crop=center",
        ],
        dark: [
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop&crop=center",
        ],
    },
    hoodie: {
        gray: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop&crop=center",
        ],
        navy: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop&crop=center",
        ],
    },
    dress: {
        pink: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
        ],
        blue: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
        ],
    },
    blouse: {
        white: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
        ],
        blue: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center",
        ],
    },
    shoes: {
        white: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
        ],
        black: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
        ],
        brown: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
        ],
        navy: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
        ],
    },
    accessories: {
        brown: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
        ],
        black: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
        ],
        beige: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
        ],
        gray: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
        ],
    },
    default: [
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=600&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=600&fit=crop&crop=center",
    ],
};
const getImagesForProduct = (productTitle, colorName) => {
    const title = productTitle.toLowerCase();
    const color = colorName.toLowerCase();
    if (title.includes("tshirt") || title.includes("t-shirt")) {
        if (color.includes("white"))
            return imageUrls.tshirt.white;
        if (color.includes("black"))
            return imageUrls.tshirt.black;
        if (color.includes("navy"))
            return imageUrls.tshirt.navy;
    }
    if (title.includes("jeans")) {
        if (color.includes("blue"))
            return imageUrls.jeans.blue;
        if (color.includes("black"))
            return imageUrls.jeans.black;
        if (color.includes("light"))
            return imageUrls.jeans.light;
        if (color.includes("dark"))
            return imageUrls.jeans.dark;
    }
    if (title.includes("hoodie") || title.includes("sweatshirt")) {
        if (color.includes("gray"))
            return imageUrls.hoodie.gray;
        if (color.includes("navy"))
            return imageUrls.hoodie.navy;
    }
    if (title.includes("dress")) {
        if (color.includes("pink"))
            return imageUrls.dress.pink;
        if (color.includes("blue"))
            return imageUrls.dress.blue;
    }
    if (title.includes("blouse")) {
        if (color.includes("white"))
            return imageUrls.blouse.white;
        if (color.includes("blue"))
            return imageUrls.blouse.blue;
    }
    if (title.includes("shoes") ||
        title.includes("sneakers") ||
        title.includes("boots") ||
        title.includes("flats") ||
        title.includes("loafers")) {
        if (color.includes("white"))
            return imageUrls.shoes.white;
        if (color.includes("black"))
            return imageUrls.shoes.black;
        if (color.includes("brown"))
            return imageUrls.shoes.brown;
        if (color.includes("navy"))
            return imageUrls.shoes.navy;
    }
    if (title.includes("wallet") ||
        title.includes("belt") ||
        title.includes("backpack") ||
        title.includes("tote") ||
        title.includes("bag")) {
        if (color.includes("brown"))
            return imageUrls.accessories.brown;
        if (color.includes("black"))
            return imageUrls.accessories.black;
        if (color.includes("beige"))
            return imageUrls.accessories.beige;
        if (color.includes("gray"))
            return imageUrls.accessories.gray;
    }
    return imageUrls.default;
};
const updateProductImages = () => {
    DummyProducts_1.dummyProducts.forEach((product) => {
        if (product.variants) {
            product.variants.forEach((size) => {
                size.variants.forEach((variant) => {
                    variant.images = getImagesForProduct(product.title || "", variant.colorName);
                });
            });
        }
    });
};
updateProductImages();
const updatedContent = `import { ProductDocument } from "../models/ProductModal";

export const dummyProducts: Partial<ProductDocument>[] = ${JSON.stringify(DummyProducts_1.dummyProducts, null, 2)};
`;
fs_1.default.writeFileSync("/Users/surya3209/Desktop/Manualfits/backend/src/data/DummyProducts.ts", updatedContent);
