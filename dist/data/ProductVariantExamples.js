"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscountPercent = exports.getAvailableSizes = exports.getAvailableColorsForSize = exports.getVariantBySizeAndColor = exports.exampleProducts = void 0;
exports.exampleProducts = [
    {
        title: "Men's Oversized Cotton T-Shirt",
        description: "Premium quality oversized cotton t-shirt perfect for casual wear. Made with 100% organic cotton for maximum comfort.",
        category: "Men",
        subcategory: ["T-Shirts", "Casual Wear"],
        brand: "Manualfits",
        tags: ["oversized", "casual", "men", "cotton", "organic"],
        rating: 4.5,
        reviewCount: 128,
        isActive: true,
        variants: [
            {
                size: "L",
                colors: [
                    {
                        colorName: "Black",
                        colorCode: "#000000",
                        images: [
                            "/images/tshirt-black-1.jpg",
                            "/images/tshirt-black-2.jpg",
                            "/images/tshirt-black-3.jpg",
                        ],
                        stock: 25,
                        price: 999,
                        originalPrice: 1499,
                        sku: "MF-TSHIRT-L-BLK",
                    },
                    {
                        colorName: "White",
                        colorCode: "#ffffff",
                        images: [
                            "/images/tshirt-white-1.jpg",
                            "/images/tshirt-white-2.jpg",
                        ],
                        stock: 30,
                        price: 999,
                        originalPrice: 1499,
                        sku: "MF-TSHIRT-L-WHT",
                    },
                    {
                        colorName: "Navy Blue",
                        colorCode: "#1e3a8a",
                        images: ["/images/tshirt-navy-1.jpg", "/images/tshirt-navy-2.jpg"],
                        stock: 20,
                        price: 999,
                        originalPrice: 1499,
                        sku: "MF-TSHIRT-L-NVY",
                    },
                ],
            },
            {
                size: "M",
                colors: [
                    {
                        colorName: "Black",
                        colorCode: "#000000",
                        images: [
                            "/images/tshirt-black-1.jpg",
                            "/images/tshirt-black-2.jpg",
                        ],
                        stock: 35,
                        price: 899,
                        originalPrice: 1399,
                        sku: "MF-TSHIRT-M-BLK",
                    },
                    {
                        colorName: "White",
                        colorCode: "#ffffff",
                        images: [
                            "/images/tshirt-white-1.jpg",
                            "/images/tshirt-white-2.jpg",
                        ],
                        stock: 40,
                        price: 899,
                        originalPrice: 1399,
                        sku: "MF-TSHIRT-M-WHT",
                    },
                ],
            },
            {
                size: "XL",
                colors: [
                    {
                        colorName: "Black",
                        colorCode: "#000000",
                        images: [
                            "/images/tshirt-black-1.jpg",
                            "/images/tshirt-black-2.jpg",
                        ],
                        stock: 15,
                        price: 1099,
                        originalPrice: 1599,
                        sku: "MF-TSHIRT-XL-BLK",
                    },
                ],
            },
        ],
        detailedDescription: "This premium oversized cotton t-shirt is designed for ultimate comfort and style. The relaxed fit provides freedom of movement while maintaining a trendy appearance. Perfect for casual outings, weekend wear, or layering under jackets.",
        specifications: [
            { key: "Material", value: "100% Organic Cotton" },
            { key: "Fit", value: "Oversized" },
            { key: "Care Instructions", value: "Machine wash cold, tumble dry low" },
            { key: "Origin", value: "Made in India" },
        ],
        careInstructions: [
            "Machine wash in cold water",
            "Use mild detergent",
            "Do not bleach",
            "Tumble dry on low heat",
            "Iron on medium heat if needed",
        ],
        keyFeatures: [
            "100% Organic Cotton",
            "Oversized Fit",
            "Pre-shrunk fabric",
            "Soft and breathable",
            "Colorfast dyeing",
        ],
        material: "100% Organic Cotton",
        weight: "180 GSM",
        warranty: "1 year against manufacturing defects",
        origin: "India",
    },
    {
        title: "Women's Floral Summer Dress",
        description: "Elegant floral summer dress perfect for warm weather. Lightweight and breathable fabric with beautiful floral patterns.",
        category: "Women",
        subcategory: ["Dresses", "Casual Daywear"],
        brand: "Manualfits",
        tags: ["floral", "summer", "dress", "casual", "lightweight"],
        rating: 4.8,
        reviewCount: 95,
        isActive: true,
        variants: [
            {
                size: "S",
                colors: [
                    {
                        colorName: "Floral Pink",
                        colorCode: "#fce7f3",
                        images: ["/images/dress-pink-1.jpg", "/images/dress-pink-2.jpg"],
                        stock: 12,
                        price: 1899,
                        originalPrice: 2499,
                        sku: "MF-DRESS-S-PINK",
                    },
                ],
            },
            {
                size: "M",
                colors: [
                    {
                        colorName: "Floral Pink",
                        colorCode: "#fce7f3",
                        images: ["/images/dress-pink-1.jpg", "/images/dress-pink-2.jpg"],
                        stock: 18,
                        price: 1899,
                        originalPrice: 2499,
                        sku: "MF-DRESS-M-PINK",
                    },
                    {
                        colorName: "Floral Blue",
                        colorCode: "#dbeafe",
                        images: ["/images/dress-blue-1.jpg", "/images/dress-blue-2.jpg"],
                        stock: 15,
                        price: 1899,
                        originalPrice: 2499,
                        sku: "MF-DRESS-M-BLUE",
                    },
                ],
            },
            {
                size: "L",
                colors: [
                    {
                        colorName: "Floral Pink",
                        colorCode: "#fce7f3",
                        images: ["/images/dress-pink-1.jpg", "/images/dress-pink-2.jpg"],
                        stock: 10,
                        price: 1899,
                        originalPrice: 2499,
                        sku: "MF-DRESS-L-PINK",
                    },
                    {
                        colorName: "Floral Blue",
                        colorCode: "#dbeafe",
                        images: ["/images/dress-blue-1.jpg", "/images/dress-blue-2.jpg"],
                        stock: 8,
                        price: 1899,
                        originalPrice: 2499,
                        sku: "MF-DRESS-L-BLUE",
                    },
                ],
            },
        ],
        detailedDescription: "This beautiful floral summer dress features a comfortable fit with elegant design elements. The lightweight fabric ensures you stay cool during warm weather while the floral pattern adds a touch of femininity and style.",
        specifications: [
            { key: "Material", value: "Cotton Blend" },
            { key: "Fit", value: "Regular Fit" },
            { key: "Length", value: "Knee Length" },
            { key: "Pattern", value: "Floral Print" },
        ],
        careInstructions: [
            "Hand wash recommended",
            "Use cold water",
            "Do not wring",
            "Hang dry",
            "Iron on low heat",
        ],
        keyFeatures: [
            "Lightweight fabric",
            "Breathable material",
            "Beautiful floral print",
            "Comfortable fit",
            "Perfect for summer",
        ],
        material: "Cotton Blend",
        weight: "120 GSM",
        warranty: "6 months against manufacturing defects",
        origin: "India",
    },
];
const getVariantBySizeAndColor = (product, size, colorName) => {
    const sizeVariant = product.variants.find((s) => s.size === size);
    if (!sizeVariant)
        return null;
    const colorVariant = sizeVariant.colors.find((v) => v.colorName === colorName);
    return colorVariant || null;
};
exports.getVariantBySizeAndColor = getVariantBySizeAndColor;
const getAvailableColorsForSize = (product, size) => {
    const sizeVariant = product.variants.find((s) => s.size === size);
    return sizeVariant ? sizeVariant.colors : [];
};
exports.getAvailableColorsForSize = getAvailableColorsForSize;
const getAvailableSizes = (product) => {
    return product.variants.map((s) => s.size);
};
exports.getAvailableSizes = getAvailableSizes;
const calculateDiscountPercent = (originalPrice, currentPrice) => {
    if (originalPrice <= 0)
        return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};
exports.calculateDiscountPercent = calculateDiscountPercent;
