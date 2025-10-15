"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.deleteProduct = exports.updateVariantStock = exports.updateProduct = exports.addProduct = exports.getVariantDetails = exports.getProductBySlug = exports.getProductById = exports.getAllProducts = void 0;
const ProductModal_1 = __importDefault(require("../models/ProductModal"));
const getAllProducts = async (req, res) => {
    try {
        const { category, subcategory, brand, minPrice, maxPrice, inStock, limit = 20, page = 1, sortBy = "createdAt", sortOrder = "desc", } = req.query;
        const filter = { isActive: true };
        if (category)
            filter.category = category;
        if (subcategory)
            filter.subcategory = {
                $in: Array.isArray(subcategory) ? subcategory : [subcategory],
            };
        if (brand)
            filter.brand = new RegExp(brand, "i");
        if (inStock === "true") {
        }
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const skip = (Number(page) - 1) * Number(limit);
        let pipeline = [
            { $match: filter },
            {
                $addFields: {
                    totalStock: {
                        $sum: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: "$$variant.stock",
                            },
                        },
                    },
                    minPrice: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: "$$variant.price",
                            },
                        },
                    },
                    maxPrice: {
                        $max: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: "$$variant.price",
                            },
                        },
                    },
                },
            },
        ];
        if (inStock === "true") {
            pipeline.push({ $match: { totalStock: { $gt: 0 } } });
        }
        if (minPrice || maxPrice) {
            const priceFilter = {};
            if (minPrice)
                priceFilter.$gte = Number(minPrice);
            if (maxPrice)
                priceFilter.$lte = Number(maxPrice);
            pipeline.push({ $match: { minPrice: priceFilter } });
        }
        pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: Number(limit) });
        const products = await ProductModal_1.default.aggregate(pipeline);
        const total = await ProductModal_1.default.countDocuments(filter);
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalProducts: total,
                hasNextPage: skip + Number(limit) < total,
                hasPrevPage: Number(page) > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModal_1.default.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        if (!product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product is not available",
            });
        }
        res.json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getProductById = getProductById;
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await ProductModal_1.default.findOne({ slug, isActive: true });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        console.error("Error fetching product by slug:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getProductBySlug = getProductBySlug;
const getVariantDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, color } = req.query;
        if (!size || !color) {
            return res.status(400).json({
                success: false,
                message: "Size and color parameters are required",
            });
        }
        const product = await ProductModal_1.default.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        const variant = product.variants.find((v) => v.size === size && v.color === color);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Variant not found",
            });
        }
        res.json({
            success: true,
            data: {
                variant,
                availableSizes: product.variants.map((v) => v.size),
                availableColors: product.variants
                    .filter((v) => v.size === size)
                    .map((v) => v.color),
            },
        });
    }
    catch (error) {
        console.error("Error fetching variant details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch variant details",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getVariantDetails = getVariantDetails;
const addProduct = async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.title ||
            !productData.description ||
            !productData.category ||
            !productData.brand) {
            return res.status(400).json({
                success: false,
                message: "Title, description, category, and brand are required",
            });
        }
        if (!productData.variants || productData.variants.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one variant is required",
            });
        }
        for (const variant of productData.variants) {
            if (!variant.size ||
                !variant.color ||
                !variant.sku ||
                !variant.images ||
                variant.images.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Each variant must have size, color, sku, and at least one image",
                });
            }
            if (variant.price < 0 || variant.originalPrice < 0 || variant.stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price, originalPrice, and stock must be non-negative",
                });
            }
        }
        const product = new ProductModal_1.default(productData);
        await product.save();
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        if (error instanceof Error && error.message.includes("duplicate key")) {
            return res.status(400).json({
                success: false,
                message: "Product with this slug or SKU already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.addProduct = addProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const product = await ProductModal_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.updateProduct = updateProduct;
const updateVariantStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, colorName, stock } = req.body;
        if (!size || !colorName || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: "Size, colorName, and stock are required",
            });
        }
        const product = await ProductModal_1.default.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        product.totalStock = stock;
        await product.save();
        res.json({
            success: true,
            message: "Total stock updated successfully",
            data: {
                totalStock: product.totalStock,
            },
        });
    }
    catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update stock",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.updateVariantStock = updateVariantStock;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModal_1.default.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.deleteProduct = deleteProduct;
const searchProducts = async (req, res) => {
    try {
        const { q, limit = 10, page = 1 } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }
        const skip = (Number(page) - 1) * Number(limit);
        const products = await ProductModal_1.default.find({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { description: { $regex: q, $options: "i" } },
                        { tags: { $in: [new RegExp(q, "i")] } },
                        { brand: { $regex: q, $options: "i" } },
                    ],
                },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await ProductModal_1.default.countDocuments({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { description: { $regex: q, $options: "i" } },
                        { tags: { $in: [new RegExp(q, "i")] } },
                        { brand: { $regex: q, $options: "i" } },
                    ],
                },
            ],
        });
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalProducts: total,
                hasNextPage: skip + Number(limit) < total,
                hasPrevPage: Number(page) > 1,
            },
        });
    }
    catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.searchProducts = searchProducts;
